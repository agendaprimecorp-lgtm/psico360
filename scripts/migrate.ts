import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { criarPool } from "../db/client";

config({ path: ".env.local", quiet: true });

const alvo =
  process.argv[2] === "test" ? "DATABASE_URL_TEST_OWNER" : "DATABASE_URL_OWNER";
const pool = criarPool(process.env[alvo]!);

async function migrar() {
  await pool.query(`
    create table if not exists _migracoes (
      nome        text primary key,
      checksum    text,
      aplicada_em timestamptz not null default now()
    );
  `);
  await pool.query("alter table _migracoes add column if not exists checksum text");

  const dir = join(process.cwd(), "db", "migrations");
  const arquivos = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const arquivo of arquivos) {
    const sql = readFileSync(join(dir, arquivo), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    const { rows } = await pool.query(
      "select checksum from _migracoes where nome = $1",
      [arquivo],
    );

    if (rows.length > 0) {
      const gravado = rows[0].checksum;
      if (gravado === null) {
        // Migração aplicada antes de existir controle de checksum: registra o
        // valor atual para que alterações futuras sejam detectadas.
        await pool.query(
          "update _migracoes set checksum = $1 where nome = $2",
          [checksum, arquivo],
        );
        console.log(`- ${arquivo} (já aplicada, checksum registrado)`);
      } else if (gravado !== checksum) {
        throw new Error(
          `A migração ${arquivo} foi alterada depois de aplicada neste banco.\n` +
            `Migração aplicada não se edita: crie uma nova. Editar faz os bancos ` +
            `divergirem em silêncio — e as políticas de isolamento moram nestes arquivos.`,
        );
      } else {
        console.log(`- ${arquivo} (já aplicada)`);
      }
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into _migracoes (nome, checksum) values ($1, $2)",
        [arquivo, checksum],
      );
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
