import type { Pool } from "pg";
import { comOrganizacao } from "../db/tenant";
import { protegerSenha } from "./senha";

export type Papel = "SST_ADMIN" | "SST_TECNICO" | "EMPRESA_RH";

export async function criarUsuario(
  pool: Pool,
  entrada: { email: string; senha: string; nome: string },
): Promise<{ id: string }> {
  const hash = await protegerSenha(entrada.senha);
  const { rows } = await pool.query(
    `insert into users (email, nome, senha_hash)
     values ($1, $2, $3)
     returning id`,
    [entrada.email.toLowerCase().trim(), entrada.nome, hash],
  );
  return { id: rows[0].id };
}

export async function vincular(
  pool: Pool,
  entrada: { userId: string; organizationId: string; papel: Papel },
): Promise<void> {
  // A insercao PRECISA rodar com o contexto declarado — ver a nota abaixo.
  await comOrganizacao(pool, entrada.organizationId, async (client) => {
    await client.query(
      `insert into org_members (organization_id, user_id, papel)
       values ($1, $2, $3)`,
      [entrada.organizationId, entrada.userId, entrada.papel],
    );
  });
}
