import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { criarUsuario, vincular } from "@/lib/usuarios";
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
  const { id } = await criarUsuario(app, {
    email: "login@consultoria-a.com.br",
    senha: "senha-de-teste-123",
    nome: "Usuário Login",
  });
  await vincular(app, { userId: id, organizationId: orgA, papel: "SST_ADMIN" });
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
});
