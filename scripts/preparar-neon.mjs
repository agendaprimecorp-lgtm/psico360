/**
 * Prepara um projeto Neon novo para o PSICO360: cria os dois bancos, cria o
 * papel da aplicação e grava as quatro strings de conexão no `.env.local`.
 *
 * Por que existe: o caminho manual tem quatro etapas no painel, duas no SQL
 * Editor e montagem de URL à mão. Aqui é um comando.
 *
 * Uma correção importante embutida: em PostgreSQL o papel pertence ao servidor,
 * não ao banco. Existe UM `psico360_app`, com UMA senha, usado pelos dois
 * bancos — tentar criá-lo duas vezes falha com "role already exists".
 *
 * O papel é criado por SQL de propósito. Papéis criados pelo painel do Neon
 * recebem membresia em `neon_superuser`, que carrega BYPASSRLS — e aí as
 * políticas de isolamento entre organizações deixam de valer, em silêncio.
 * O script confere isso ao final e recusa terminar se estiver errado.
 *
 * Uso: NEON_OWNER_URL="postgresql://..." node scripts/preparar-neon.mjs
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAPEL = "psico360_app";
const BANCOS = ["psico360_dev", "psico360_test"];

const entrada = process.env.NEON_OWNER_URL;
if (!entrada) {
  console.error("Faltou NEON_OWNER_URL no ambiente.");
  process.exit(1);
}

function senhaForte() {
  return Array.from(randomBytes(24))
    .map((b) => ALFABETO[b % ALFABETO.length])
    .join("");
}

/**
 * Neon expõe dois endpoints: o com `-pooler` divide conexões entre clientes, e
 * o direto. DDL como CREATE DATABASE precisa do direto.
 */
function semPooler(url) {
  const u = new URL(url);
  u.hostname = u.hostname.replace("-pooler", "");
  return u.toString();
}

function comBanco(url, banco) {
  const u = new URL(url);
  u.pathname = `/${banco}`;
  return u.toString();
}

function comCredenciais(url, usuario, senha) {
  const u = new URL(url);
  u.username = usuario;
  u.password = senha;
  return u.toString();
}

async function executar(url, sql, params = []) {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

async function tentar(url, sql, rotulo, codigosAceitos = []) {
  try {
    await executar(url, sql);
    console.log(`  criado: ${rotulo}`);
  } catch (erro) {
    if (codigosAceitos.includes(erro.code)) {
      console.log(`  já existia: ${rotulo}`);
      return "existia";
    }
    throw erro;
  }
  return "criado";
}

const urlAdmin = semPooler(entrada);
const senhaApp = senhaForte();

console.log("1. Criando os bancos");
for (const banco of BANCOS) {
  // 42P04 = duplicate_database
  await tentar(urlAdmin, `create database ${banco}`, banco, ["42P04"]);
}

console.log("2. Criando o papel da aplicação");
// 42710 = duplicate_object
const estado = await tentar(
  urlAdmin,
  `create role ${PAPEL} with login password '${senhaApp}'`,
  PAPEL,
  ["42710"],
);
if (estado === "existia") {
  await executar(urlAdmin, `alter role ${PAPEL} with password '${senhaApp}'`);
  console.log("  senha redefinida");
}

console.log("3. Garantindo que o papel não ignora RLS");
await executar(urlAdmin, `alter role ${PAPEL} nobypassrls`).catch(() => {
  console.log("  (sem permissão para alterar o atributo; será conferido abaixo)");
});

console.log("4. Concedendo acesso aos bancos");
for (const banco of BANCOS) {
  await executar(urlAdmin, `grant connect on database ${banco} to ${PAPEL}`);
  console.log(`  connect em ${banco}`);
}

console.log("5. Conferindo cada conexão");
const urls = {
  DATABASE_URL_OWNER: comBanco(urlAdmin, "psico360_dev"),
  DATABASE_URL_APP: comCredenciais(
    comBanco(entrada, "psico360_dev"),
    PAPEL,
    senhaApp,
  ),
  DATABASE_URL_TEST_OWNER: comBanco(urlAdmin, "psico360_test"),
  DATABASE_URL_TEST_APP: comCredenciais(
    comBanco(entrada, "psico360_test"),
    PAPEL,
    senhaApp,
  ),
};

for (const [nome, url] of Object.entries(urls)) {
  const { rows } = await executar(
    url,
    "select current_database() as banco, current_user as papel",
  );
  console.log(`  ${nome}: ${rows[0].banco} como ${rows[0].papel}`);
}

console.log("6. Conferindo que o papel da aplicação sofre RLS");
const { rows: diag } = await executar(
  urls.DATABASE_URL_APP,
  `select
     (select rolbypassrls from pg_roles where rolname = current_user) as ignora_rls,
     exists (
       select 1
         from pg_auth_members m
         join pg_roles concedido on concedido.oid = m.roleid
         join pg_roles membro    on membro.oid    = m.member
        where membro.rolname = current_user
          and concedido.rolname = 'neon_superuser'
     ) as herda_superuser`,
);

if (diag[0].ignora_rls || diag[0].herda_superuser) {
  console.error("");
  console.error("FALHA CRÍTICA: o papel da aplicação ignora RLS.");
  console.error(`  rolbypassrls=${diag[0].ignora_rls}`);
  console.error(`  herda neon_superuser=${diag[0].herda_superuser}`);
  console.error("O isolamento entre organizações não funcionaria. Nada gravado.");
  process.exit(1);
}
console.log("  ignora RLS: não | herda neon_superuser: não");

console.log("7. Gravando o .env.local");
let texto = readFileSync(".env.local", "utf8");
const segredo = (texto.match(/^SESSION_SECRET=(.*)$/m) || ["", ""])[1].trim();

texto = [
  "# Gerado por scripts/preparar-neon.mjs. Nunca versionado.",
  "",
  ...Object.entries(urls).map(([nome, url]) => `${nome}=${url}`),
  `SESSION_SECRET=${segredo}`,
].join("\r\n") + "\r\n";

writeFileSync(".env.local", texto);
console.log("  quatro conexões gravadas (valores não exibidos)");
console.log("");
console.log("Pronto.");
