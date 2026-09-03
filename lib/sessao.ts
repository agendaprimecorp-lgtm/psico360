import { createHash, randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { conferirSenha, protegerSenha } from "./senha";

/**
 * Hash descartável, usado só para gastar o mesmo tempo de CPU quando o e-mail
 * não existe. Sem isto, o login vira um oráculo: e-mail inexistente responde em
 * milissegundos, e-mail existente com senha errada gasta o argon2id inteiro — e
 * a diferença revela quem está cadastrado, apesar da mensagem única na tela.
 *
 * Gerado uma vez, na carga do módulo, a partir de um valor aleatório que
 * ninguém conhece.
 */
const HASH_DESCARTAVEL = protegerSenha(randomBytes(32).toString("hex"));

export const DURACAO_HORAS = 12;

/**
 * O token vai para o cookie do navegador; no banco guardamos apenas o SHA-256
 * dele. Quem obtiver uma cópia do banco não obtém sessões utilizáveis.
 */
function embaralhar(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function autenticar(
  pool: Pool,
  email: string,
  senha: string,
): Promise<{ token: string; organizationId: string; userId: string } | null> {
  // Ler org_members diretamente aqui devolveria zero linhas: a politica de RLS
  // exige a organizacao, que e exatamente o que ainda nao sabemos. A funcao
  // credencial_por_email resolve isso — ver o comentario na migracao 0005.
  const { rows } = await pool.query(
    "select user_id, senha_hash, organization_id from credencial_por_email($1)",
    [email.toLowerCase().trim()],
  );
  if (rows.length === 0) {
    // Gasta o mesmo tempo do caminho de senha errada, para que a duração da
    // resposta não revele se o e-mail existe.
    await conferirSenha(await HASH_DESCARTAVEL, senha);
    return null;
  }

  const usuario = rows[0];
  if (!(await conferirSenha(usuario.senha_hash, senha))) return null;

  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + DURACAO_HORAS * 60 * 60 * 1000);

  // sessoes nao e mais alcancavel diretamente pelo papel da aplicacao: as
  // quatro funcoes security definer da migracao 0006 sao a unica porta, e cada
  // uma so toca a linha cujo hash de token o chamador ja conhece.
  await pool.query("select criar_sessao($1, $2, $3, $4)", [
    embaralhar(token),
    usuario.user_id,
    usuario.organization_id,
    expiraEm,
  ]);

  return {
    token,
    userId: usuario.user_id,
    organizationId: usuario.organization_id,
  };
}

export async function lerSessao(
  pool: Pool,
  token: string,
): Promise<{ userId: string; organizationId: string } | null> {
  const { rows } = await pool.query(
    "select user_id, organization_id from sessao_por_token($1)",
    [embaralhar(token)],
  );
  if (rows.length === 0) return null;
  return {
    userId: rows[0].user_id,
    organizationId: rows[0].organization_id,
  };
}

export async function encerrar(pool: Pool, token: string): Promise<void> {
  await pool.query("select encerrar_sessao($1)", [embaralhar(token)]);
}
