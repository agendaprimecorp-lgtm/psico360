import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";
import { comOrganizacao } from "@/db/tenant";
import { recusadoPorPrivilegio } from "../ajudantes";

// Dono: prepara o cenário, ignora RLS.
const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);
// Aplicação: é sobre este papel que as políticas incidem.
const app = criarPool(process.env.DATABASE_URL_TEST_APP!);

let orgA: string;
let orgB: string;

beforeAll(async () => {
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

describe("isolamento por organização", () => {
  // Este teste vem primeiro de propósito. Se ele falhar, TODOS os outros deste
  // arquivo passam por engano: um papel com BYPASSRLS — ou que herde
  // neon_superuser, que o carrega — ignora as políticas silenciosamente, e o
  // isolamento entre organizações deixa de existir sem nenhum sinal visível.
  it("o papel da aplicação não ignora RLS nem herda neon_superuser", async () => {
    const { rows } = await app.query(`
      select
        (select rolbypassrls
           from pg_roles
          where rolname = current_user) as ignora_rls,
        exists (
          select 1
            from pg_auth_members m
            join pg_roles concedido on concedido.oid = m.roleid
            join pg_roles membro    on membro.oid    = m.member
           where membro.rolname = current_user
             and concedido.rolname = 'neon_superuser'
        ) as herda_superuser
    `);
    expect(rows[0].ignora_rls).toBe(false);
    expect(rows[0].herda_superuser).toBe(false);
  });

  it("enxerga a própria organização", async () => {
    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query("select id, nome from organizations");
      return rows;
    });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].nome).toBe("Consultoria A");
  });

  it("não enxerga outra organização, mesmo pedindo pelo id dela", async () => {
    const linhas = await comOrganizacao(app, orgA, async (client) => {
      const { rows } = await client.query(
        "select id from organizations where id = $1",
        [orgB],
      );
      return rows;
    });
    expect(linhas).toHaveLength(0);
  });

  it("não altera linha de outra organização", async () => {
    const afetadas = await comOrganizacao(app, orgA, async (client) => {
      const { rowCount } = await client.query(
        "update organizations set nome = 'invadida' where id = $1",
        [orgB],
      );
      return rowCount;
    });
    expect(afetadas).toBe(0);

    const { rows } = await dono.query(
      "select nome from organizations where id = $1",
      [orgB],
    );
    expect(rows[0].nome).toBe("Consultoria B");
  });

  it("não apaga linha de outra organização", async () => {
    // Delete foi revogado do papel da aplicação (0002b): o Postgres recusa
    // por falta de privilégio, antes mesmo de avaliar a política de RLS.
    await recusadoPorPrivilegio(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("delete from organizations where id = $1", [orgB]);
      }),
    );

    const { rowCount } = await dono.query(
      "select 1 from organizations where id = $1",
      [orgB],
    );
    expect(rowCount).toBe(1);
  });

  it("sem contexto declarado, não enxerga nada", async () => {
    const client = await app.connect();
    try {
      const { rows } = await client.query("select id from organizations");
      expect(rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });

  it("o papel da aplicação não cria nem apaga organização", async () => {
    // Criar e apagar organizacao sao atos de plataforma, do papel dono.
    // Sem o privilegio, o Postgres recusa antes de avaliar politica alguma.
    await recusadoPorPrivilegio(
      comOrganizacao(app, orgA, async (client) => {
        await client.query(
          "insert into organizations (nome, tipo) values ('Intrusa', 'SST')",
        );
      }),
    );

    await recusadoPorPrivilegio(
      comOrganizacao(app, orgA, async (client) => {
        await client.query("delete from organizations where id = $1", [orgA]);
      }),
    );

    const { rowCount } = await dono.query("select 1 from organizations");
    expect(rowCount).toBe(2);
  });
});
