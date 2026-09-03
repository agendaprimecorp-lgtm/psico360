import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { criarPool } from "../db/client";

config({ path: ".env.local" });

const alvo =
  process.argv[2] === "test" ? "DATABASE_URL_TEST_OWNER" : "DATABASE_URL_OWNER";
const pool = criarPool(process.env[alvo]!);

async function migrar() {
  await pool.query(`
    create table if not exists _migracoes (
      nome        text primary key,
      aplicada_em timestamptz not null default now()
    );
  `);

  const dir = join(process.cwd(), "db", "migrations");
  const arquivos = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const arquivo of arquivos) {
    const { rowCount } = await pool.query(
      "select 1 from _migracoes where nome = $1",
      [arquivo],
    );
    if (rowCount) {
      console.log(`- ${arquivo} (já aplicada)`);
      continue;
    }
    const sql = readFileSync(join(dir, arquivo), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migracoes (nome) values ($1)", [arquivo]);
      await client.query("commit");
      console.log(`+ ${arquivo}`);
    } catch (erro) {
      await client.query("rollback");
      throw erro;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

migrar().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
