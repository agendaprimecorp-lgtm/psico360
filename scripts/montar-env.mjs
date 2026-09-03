/**
 * Monta as duas strings de conexão do papel da aplicação a partir das duas
 * strings do papel dono que o usuário colou no `.env.local`.
 *
 * Por que existe: montar essas URLs à mão significa editar o meio de um texto
 * longo, trocando usuário e senha sem encostar em host, porta e nome do banco.
 * É onde um erro de um caractere custa meia hora de diagnóstico. O script faz a
 * troca sempre igual.
 *
 * Uso: npm run montar-env
 */

import { readFileSync, writeFileSync } from "node:fs";

const ARQUIVO = ".env.local";
const PAPEL = "psico360_app";

function ler(texto, chave) {
  const achado = texto.match(new RegExp(`^${chave}=(.*)$`, "m"));
  return achado ? achado[1].trim() : "";
}

function gravar(texto, chave, valor) {
  return texto.replace(new RegExp(`^${chave}=.*$`, "m"), `${chave}=${valor}`);
}

/**
 * Troca apenas as credenciais da URL, preservando host, porta, banco e
 * parâmetros. `URL` do Node faz o trabalho e recusa string malformada, o que
 * nos dá validação de graça.
 */
function trocarCredenciais(urlDono, senha) {
  const url = new URL(urlDono);
  url.username = PAPEL;
  url.password = senha;
  return url.toString();
}

function conferir(rotulo, valor, dica) {
  if (!valor) {
    console.error(`FALTANDO: ${rotulo}`);
    console.error(`   ${dica}\n`);
    return false;
  }
  return true;
}

const texto = readFileSync(ARQUIVO, "utf8");

const donoDev = ler(texto, "DATABASE_URL_OWNER");
const donoTest = ler(texto, "DATABASE_URL_TEST_OWNER");
const senhaDev = ler(texto, "SENHA_APP_DEV");
const senhaTest = ler(texto, "SENHA_APP_TEST");

const completo =
  conferir(
    "DATABASE_URL_OWNER",
    donoDev,
    "Cole a string do papel dono do banco psico360_dev nessa linha.",
  ) &&
  conferir(
    "DATABASE_URL_TEST_OWNER",
    donoTest,
    "Cole a string do papel dono do banco psico360_test nessa linha.",
  ) &&
  conferir(
    "SENHA_APP_DEV",
    senhaDev,
    "Essa linha deveria ter vindo preenchida. Veja NEON-PASSO-A-PASSO.local.txt.",
  ) &&
  conferir(
    "SENHA_APP_TEST",
    senhaTest,
    "Essa linha deveria ter vindo preenchida. Veja NEON-PASSO-A-PASSO.local.txt.",
  );

if (!completo) {
  console.error("Nada foi alterado. Preencha o que falta e rode de novo.");
  process.exit(1);
}

let saida = texto;
try {
  saida = gravar(saida, "DATABASE_URL_APP", trocarCredenciais(donoDev, senhaDev));
  saida = gravar(
    saida,
    "DATABASE_URL_TEST_APP",
    trocarCredenciais(donoTest, senhaTest),
  );
} catch (erro) {
  console.error("A string colada não é uma URL de conexão válida.");
  console.error(`Detalhe: ${erro.message}`);
  console.error(
    "Confira se ela começa com postgresql:// e está inteira numa linha só.",
  );
  process.exit(1);
}

// Aviso útil: bancos iguais em dev e teste fariam a suíte de testes apagar
// dados de desenvolvimento no `beforeAll`.
if (donoDev === donoTest) {
  console.error(
    "ATENÇÃO: as duas strings do papel dono são idênticas. O banco de testes " +
      "apaga dados a cada execução — se ele for o mesmo de desenvolvimento, " +
      "você perde seu trabalho. Use bancos separados.",
  );
  process.exit(1);
}

writeFileSync(ARQUIVO, saida);

console.log("Pronto. Montadas as duas linhas do papel da aplicação:");
console.log("  DATABASE_URL_APP");
console.log("  DATABASE_URL_TEST_APP");
console.log("(valores não exibidos por serem credenciais)");
