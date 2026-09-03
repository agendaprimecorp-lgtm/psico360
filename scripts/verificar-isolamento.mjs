/**
 * Confere, contra o banco que a aplicação realmente usa, que o isolamento entre
 * organizações está de pé. Feito para rodar em CI e antes de cada publicação.
 *
 * A suíte de testes prova isso no banco de testes. Este script prova no banco
 * que atende usuário — e são coisas diferentes: basta alguém recriar o papel
 * pelo painel do Neon, ou redefinir a senha por lá, para o papel ganhar
 * neon_superuser (que carrega BYPASSRLS) e o isolamento sumir sem nenhum sinal.
 *
 * Uso: npm run verificar-isolamento
 */

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL_APP;
if (!url) {
  console.error("Faltou DATABASE_URL_APP em .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const falhas = [];

async function exigir(rotulo, fn) {
  try {
    const ok = await fn();
    console.log(`${ok ? "ok  " : "FALHA"}  ${rotulo}`);
    if (!ok) falhas.push(rotulo);
  } catch (erro) {
    console.log(`FALHA  ${rotulo} — ${erro.message}`);
    falhas.push(rotulo);
  }
}

async function recusa(rotulo, sql) {
  try {
    await client.query(sql);
    console.log(`FALHA  ${rotulo} — a consulta foi permitida`);
    falhas.push(rotulo);
  } catch (erro) {
    const negado = erro.code === "42501";
    console.log(`${negado ? "ok  " : "FALHA"}  ${rotulo}${negado ? "" : ` — erro ${erro.code}, esperado 42501`}`);
    if (!negado) falhas.push(rotulo);
  }
}

await exigir("o papel da aplicação não ignora RLS", async () => {
  const { rows } = await client.query(
    "select rolbypassrls from pg_roles where rolname = current_user",
  );
  return rows[0].rolbypassrls === false;
});

await exigir("o papel da aplicação não herda neon_superuser", async () => {
  const { rows } = await client.query(`
    select exists (
      select 1 from pg_auth_members m
        join pg_roles concedido on concedido.oid = m.roleid
        join pg_roles membro    on membro.oid    = m.member
       where membro.rolname = current_user
         and concedido.rolname = 'neon_superuser'
    ) as herda`);
  return rows[0].herda === false;
});

await exigir("RLS ligada em organizations, org_members e audit_logs", async () => {
  const { rows } = await client.query(`
    select relname, relrowsecurity
      from pg_class
     where relname in ('organizations', 'org_members', 'audit_logs')`);
  return rows.length === 3 && rows.every((r) => r.relrowsecurity === true);
});

await exigir("sem contexto declarado, organizations não devolve linha", async () => {
  const { rows } = await client.query("select id from organizations");
  return rows.length === 0;
});

await exigir("sem contexto declarado, org_members não devolve linha", async () => {
  const { rows } = await client.query("select id from org_members");
  return rows.length === 0;
});

await recusa("users não é legível pela aplicação", "select id from users");
await recusa("sessoes não é legível pela aplicação", "select user_id from sessoes");
await recusa("audit_logs não aceita alteração", "update audit_logs set acao = 'x'");

await client.end();

if (falhas.length > 0) {
  console.error(`\n${falhas.length} verificação(ões) falharam. O isolamento entre organizações NÃO está garantido neste banco.`);
  process.exit(1);
}
console.log("\nIsolamento verificado.");
