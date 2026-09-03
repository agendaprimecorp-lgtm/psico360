import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { criarUsuario, vincular } from "@/lib/usuarios";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;
let orgB: string;

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
});

afterAll(async () => {
  await dono.end();
  await app.end();
});

describe("usuários e vínculos", () => {
  it("cria usuário sem guardar a senha em claro", async () => {
    const { id } = await criarUsuario(app, {
      email: "tecnico@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Técnico A",
    });
    const { rows } = await dono.query(
      "select senha_hash from users where id = $1",
      [id],
    );
    expect(rows[0].senha_hash).not.toContain("senha-de-teste-123");
  });

  it("recusa email repetido", async () => {
    await criarUsuario(app, {
      email: "repetido@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Primeiro",
    });
    await expect(
      criarUsuario(app, {
        email: "repetido@consultoria-a.com.br",
        senha: "outra-senha-123",
        nome: "Segundo",
      }),
    ).rejects.toThrow();
  });

  it("normaliza o email para minúsculas", async () => {
    const { id } = await criarUsuario(app, {
      email: "  MAIUSCULO@Consultoria-A.com.br  ",
      senha: "senha-de-teste-123",
      nome: "Maiúsculo",
    });
    const { rows } = await dono.query("select email from users where id = $1", [
      id,
    ]);
    expect(rows[0].email).toBe("maiusculo@consultoria-a.com.br");
  });

  it("vincula usuário à organização com papel", async () => {
    const { id } = await criarUsuario(app, {
      email: "vinculado@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Vinculado",
    });
    await vincular(app, {
      userId: id,
      organizationId: orgA,
      papel: "SST_TECNICO",
    });

    const vinculos = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query(
        "select papel from org_members where user_id = $1",
        [id],
      );
      return rows;
    });
    expect(vinculos).toHaveLength(1);
    expect(vinculos[0].papel).toBe("SST_TECNICO");
  });

  it("não expõe o vínculo para outra organização", async () => {
    const { id } = await criarUsuario(app, {
      email: "isolado@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Isolado",
    });
    await vincular(app, {
      userId: id,
      organizationId: orgA,
      papel: "SST_ADMIN",
    });

    const vistos = await comOrganizacao(app, orgB, async (client) => {
      const { rows } = await client.query(
        "select papel from org_members where user_id = $1",
        [id],
      );
      return rows;
    });
    expect(vistos).toHaveLength(0);
  });

  it("sem contexto declarado, não enxerga vínculo algum", async () => {
    const client = await app.connect();
    try {
      const { rows } = await client.query("select id from org_members");
      expect(rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });

  it("o papel da aplicação não altera nem apaga vínculo", async () => {
    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("update org_members set papel = 'SST_ADMIN'");
      }),
    ).rejects.toThrow();

    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("delete from org_members");
      }),
    ).rejects.toThrow();
  });

  it("o papel da aplicação não lê e-mail nem hash de senha", async () => {
    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("select email, senha_hash from users");
      }),
    ).rejects.toThrow();
  });
});
