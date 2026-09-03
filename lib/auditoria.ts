import type { PoolClient } from "pg";

export type EventoAuditoria = {
  userId: string | null;
  acao: string;
  recurso: string;
  recursoId: string | null;
  detalhe?: Record<string, unknown>;
};

/**
 * Grava o evento usando o client da transação corrente. Se a operação auditada
 * falhar e a transação for desfeita, o registro cai junto — auditoria que
 * sobrevive a uma operação que não aconteceu é ruído.
 *
 * `organization_id` não é parâmetro: vem de `app.organization_id`, o mesmo
 * valor que a política de RLS confere. Não há como registrar em nome de outra
 * organização.
 */
export async function registrar(
  client: PoolClient,
  evento: EventoAuditoria,
): Promise<void> {
  await client.query(
    `insert into audit_logs
       (organization_id, user_id, acao, recurso, recurso_id, detalhe)
     values
       (nullif(current_setting('app.organization_id', true), '')::uuid, $1, $2, $3, $4, $5)`,
    [
      evento.userId,
      evento.acao,
      evento.recurso,
      evento.recursoId,
      evento.detalhe ? JSON.stringify(evento.detalhe) : null,
    ],
  );
}
