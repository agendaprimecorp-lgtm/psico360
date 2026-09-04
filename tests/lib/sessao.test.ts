import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { criarUsuarioComVinculo } from "@/lib/usuarios";
import { autenticar, encerrar, lerSessao } from "@/lib/sessao";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;

beforeAll(async () => {
  await dono.query("delete from sessoes");
  await dono.query("delete from audit_logs");
  await dono.query("delete from org_members");
  await dono.query("delete from users");
  await dono.query("delete from organizations");
  const a = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria A', 'SST') returning id",
  );
  orgA = a.rows[0].id;
  await criarUsuarioComVinculo(app, {
    email: "login@consultoria-a.com.br",
    senha: "senha-de-teste-123",
    nome: "Usuário Login",
    organizationId: orgA,
    papel: "SST_ADMIN",
  });
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("sessão", () => {
  it("autentica com a senha correta e devolve a organização", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    expect(sessao).not.toBeNull();
    expect(sessao!.organizationId).toBe(orgA);
    expect(sessao!.token).toHaveLength(64);
  });

  it("recusa a senha errada", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-errada",
    );
    expect(sessao).toBeNull();
  });

  it("recusa email inexistente", async () => {
    const sessao = await autenticar(app, "ninguem@lugar.com", "qualquer-coisa");
    expect(sessao).toBeNull();
  });

  it("lê a sessão a partir do token", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    const lida = await lerSessao(app, sessao!.token);
    expect(lida!.organizationId).toBe(orgA);
    expect(lida!.userId).toBe(sessao!.userId);
  });

  it("não lê sessão encerrada", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    await encerrar(app, sessao!.token);
    expect(await lerSessao(app, sessao!.token)).toBeNull();
  });

  it("não guarda o token em claro no banco", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    const { rows } = await dono.query(
      "select token_hash from sessoes where token_hash = $1",
      [sessao!.token],
    );
    expect(rows).toHaveLength(0);
  });

  it("não lê sessão expirada", async () => {
    const sessao = await autenticar(
      app,
      "login@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    await dono.query(
      "update sessoes set expira_em = now() - interval '1 hour'",
    );
    expect(await lerSessao(app, sessao!.token)).toBeNull();
  });

  it("escolhe o vínculo mais antigo, não o primeiro inserido", async () => {
    const orgB = (
      await dono.query(
        "insert into organizations (nome, tipo) values ('Consultoria B', 'SST') returning id",
      )
    ).rows[0].id;

    // Cria o vinculo com orgB PRIMEIRO, para que ele seja o primeiro do heap.
    const { id } = await criarUsuarioComVinculo(app, {
      email: "multiplo@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Múltiplo",
      organizationId: orgB,
      papel: "SST_TECNICO",
    });

    await comOrganizacao(app, orgA, async (client) => {
      await client.query(
        "insert into org_members (organization_id, user_id, papel) values ($1, $2, 'SST_ADMIN')",
        [orgA, id],
      );
    });

    // Retroage o vinculo de orgA para antes do de orgB. Agora a ordem fisica
    // (orgB primeiro) e a cronologica (orgA primeiro) apontam para lados
    // opostos: sem `order by`, a funcao devolveria orgB e este teste falharia.
    await dono.query(
      `update org_members set criado_em = now() - interval '1 day'
        where user_id = $1 and organization_id = $2`,
      [id, orgA],
    );

    const sessao = await autenticar(
      app,
      "multiplo@consultoria-a.com.br",
      "senha-de-teste-123",
    );
    expect(sessao!.organizationId).toBe(orgA);
  });

  it("a função de credencial mantém a ordenação determinística", async () => {
    // Guarda contra um `create or replace` futuro que desfaca a ordenacao sem
    // que nenhum teste de comportamento perceba.
    const { rows } = await dono.query(
      "select pg_get_functiondef('credencial_por_email(text)'::regprocedure) as def",
    );
    expect(rows[0].def).toContain("order by");
  });

  it("o papel da aplicação não alcança sessoes diretamente", async () => {
    // Depois da migracao 0006 a tabela so e alcancavel pelas tres funcoes
    // security definer. Sem isso, `select distinct organization_id from sessoes`
    // entregaria a lista de todas as organizacoes que ja entraram no sistema.
    for (const sql of [
      "select user_id from sessoes",
      "insert into sessoes (token_hash, user_id, organization_id, expira_em) values ('x', gen_random_uuid(), gen_random_uuid(), now())",
      "delete from sessoes",
    ]) {
      await expect(app.query(sql)).rejects.toMatchObject({ code: "42501" });
    }
  });
});
