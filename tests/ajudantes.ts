import { expect } from "vitest";

/**
 * Afirma que a operação foi recusada por falta de privilégio, e não por um erro
 * qualquer. `rejects.toThrow()` sem argumento passa com string de conexão
 * errada, tabela inexistente ou typo no SQL — ou seja, passaria com a proteção
 * quebrada.
 *
 * 42501 é `insufficient_privilege` no PostgreSQL.
 */
export async function recusadoPorPrivilegio(promessa: Promise<unknown>) {
  await expect(promessa).rejects.toMatchObject({ code: "42501" });
}
