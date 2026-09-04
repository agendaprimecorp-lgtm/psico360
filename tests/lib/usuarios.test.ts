import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { criarUsuarioComVinculo } from "@/lib/usuarios";
import { recusadoPorPrivilegio } from "../ajudantes";

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
    const { id } = await criarUsuarioComVinculo(app, {
      email: "tecnico@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Técnico A",
      organizationId: orgA,
      papel: "SST_TECNICO",
    });
    const { rows } = await dono.query(
      "select senha_hash from users where id = $1",
      [id],
    );
    expect(rows[0].senha_hash).not.toContain("senha-de-teste-123");
  });

  it("recusa email repetido", async () => {
    await criarUsuarioComVinculo(app, {
      email: "repetido@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Primeiro",
      organizationId: orgA,
      papel: "SST_TECNICO",
    });
    // 23505 e unique_violation: a recusa aqui vem da unicidade global de
    // users.email, nao de privilegio.
    await expect(
      criarUsuarioComVinculo(app, {
        email: "repetido@consultoria-a.com.br",
        senha: "outra-senha-123",
        nome: "Segundo",
        organizationId: orgA,
        papel: "SST_TECNICO",
      }),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("normaliza o email para minúsculas", async () => {
    const { id } = await criarUsuarioComVinculo(app, {
      email: "  MAIUSCULO@Consultoria-A.com.br  ",
      senha: "senha-de-teste-123",
      nome: "Maiúsculo",
      organizationId: orgA,
      papel: "SST_TECNICO",
    });
    const { rows } = await dono.query("select email from users where id = $1", [
      id,
    ]);
    expect(rows[0].email).toBe("maiusculo@consultoria-a.com.br");
  });

  it("cria o vínculo com a organização e o papel na mesma chamada", async () => {
    const { id } = await criarUsuarioComVinculo(app, {
      email: "vinculado@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Vinculado",
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

  it("não deixa usuário órfão quando o vínculo falha", async () => {
    // Usuario e vinculo sao a mesma transacao. Se o vinculo falha — aqui, papel
    // fora do check de org_members — o usuario nao fica gravado, e o e-mail nao
    // fica queimado pela unicidade global de users.email.
    await expect(
      criarUsuarioComVinculo(app, {
        email: "orfao@consultoria-a.com.br",
        senha: "senha-de-teste-123",
        nome: "Órfão",
        organizationId: orgA,
        papel: "PAPEL_INEXISTENTE" as never,
      }),
    ).rejects.toMatchObject({ code: "23514" });

    const { rowCount } = await dono.query(
      "select 1 from users where email = $1",
      ["orfao@consultoria-a.com.br"],
    );
    expect(rowCount).toBe(0);
  });

  it("não expõe o vínculo para outra organização", async () => {
    const { id } = await criarUsuarioComVinculo(app, {
      email: "isolado@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Isolado",
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
    await recusadoPorPrivilegio(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("update org_members set papel = 'SST_ADMIN'");
      }),
    );

    await recusadoPorPrivilegio(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("delete from org_members");
      }),
    );
  });

  it("a política recusa vincular em nome de outra organização", async () => {
    const { id } = await criarUsuarioComVinculo(app, {
      email: "divergente@consultoria-a.com.br",
      senha: "senha-de-teste-123",
      nome: "Divergente",
      organizationId: orgA,
      papel: "SST_TECNICO",
    });

    await expect(
      comOrganizacao(app, orgA, async (client) => {
        await client.query(
          `insert into org_members (organization_id, user_id, papel)
           values ($1, $2, 'SST_ADMIN')`,
          [orgB, id],
        );
      }),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("o papel da aplicação não lê coluna alguma de users", async () => {
    // Uma consulta por coluna: `select email, senha_hash` reprovaria inteira na
    // primeira coluna negada, e passaria mesmo com a outra legível.
    for (const coluna of ["id", "email", "nome", "senha_hash"]) {
      await recusadoPorPrivilegio(
        app.query(`select ${coluna} from users`),
      );
    }
  });
});
