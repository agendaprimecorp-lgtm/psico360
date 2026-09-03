import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { registrar } from "@/lib/auditoria";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;
let orgB: string;
let userId: string;

beforeAll(async () => {
  await dono.query("delete from audit_logs");
  await dono.query("delete from org_members");
  await dono.query("delete from users");
  await dono.query("delete from organizations");
  const a = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria A', 'SST') returning id",
  );
  const b = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria B', 'SST') returning id",
  );
  orgA = a.rows[0].id;
  orgB = b.rows[0].id;
  const u = await dono.query(
    "insert into users (email, nome, senha_hash) values ('auditor@a.com.br', 'Auditor', 'x') returning id",
  );
  userId = u.rows[0].id;
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("trilha de auditoria", () => {
  it("registra o evento com organização, autor e ação", async () => {
    await comOrganizacao(app, orgA, async (client) => {
      await registrar(client, {
        userId,
        acao: "CRIAR",
        recurso: "empresa",
        recursoId: null,
        detalhe: { nome: "Empresa Teste" },
      });
    });

    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query("select * from audit_logs");
      return rows;
    });

    expect(linhas).toHaveLength(1);
    expect(linhas[0].acao).toBe("CRIAR");
    expect(linhas[0].recurso).toBe("empresa");
    expect(linhas[0].user_id).toBe(userId);
    expect(linhas[0].detalhe).toEqual({ nome: "Empresa Teste" });
  });

  it("não expõe registros de outra organização", async () => {
    const vistos = await comOrganizacao(app, orgB, async (client) => {
      const { rows } = await client.query("select * from audit_logs");
      return rows;
    });
    expect(vistos).toHaveLength(0);
  });

  it("é desfeito junto com a transação que falhou", async () => {
    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await registrar(client, {
          userId,
          acao: "APAGAR",
          recurso: "empresa",
          recursoId: null,
        });
        throw new Error("falha proposital");
      }),
    ).rejects.toThrow("falha proposital");

    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query(
        "select * from audit_logs where acao = 'APAGAR'",
      );
      return rows;
    });
    expect(linhas).toHaveLength(0);
  });

  it("recusa alterar registro já gravado", async () => {
    // A aplicacao nao recebe grant de update em audit_logs, entao o Postgres
    // levanta "permission denied" antes mesmo de avaliar politica alguma.
    // Erro barulhento e melhor que zero linhas em silencio numa trilha de
    // auditoria.
    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("update audit_logs set acao = 'ADULTERADO'");
      }),
    ).rejects.toThrow();

    const { rows } = await dono.query("select acao from audit_logs");
    expect(rows.map((r) => r.acao)).not.toContain("ADULTERADO");
  });

  it("recusa apagar registro já gravado", async () => {
    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("delete from audit_logs");
      }),
    ).rejects.toThrow();

    const { rowCount } = await dono.query("select 1 from audit_logs");
    expect(rowCount).toBe(1);
  });

  it("não registra em nome de outra organização", async () => {
    // registrar() nao aceita organization_id como parametro: ele vem de
    // app.organization_id. Nao ha caminho para gravar em outra organizacao.
    await comOrganizacao(app, orgB, async (client) => {
      await registrar(client, {
        userId,
        acao: "CRIAR",
        recurso: "empresa",
        recursoId: null,
      });
    });

    const daOrgA = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query("select * from audit_logs");
      return rows;
    });
    expect(daOrgA).toHaveLength(1);
  });
});
