import type { Pool, PoolClient } from "pg";

/**
 * Executa `fn` dentro de uma transação em que o Postgres sabe qual organização
 * está ativa. As políticas de RLS leem `app.organization_id`.
 *
 * O terceiro argumento de `set_config` sendo `true` amarra o valor à transação:
 * ao confirmar ou desfazer, ele some. É isso que impede o contexto de uma
 * requisição vazar para a seguinte quando a conexão volta para o pool.
 *
 * `pool` deve ser o pool do papel da aplicação. Passar o pool do dono aqui
 * anula o isolamento, porque o dono ignora RLS.
 */
export async function comOrganizacao<T>(
  pool: Pool,
  organizationId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.organization_id', $1, true)", [
      organizationId,
    ]);
    const resultado = await fn(client);
    await client.query("commit");
    return resultado;
  } catch (erro) {
    await client.query("rollback");
    throw erro;
  } finally {
    client.release();
  }
}
