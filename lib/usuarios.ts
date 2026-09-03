import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { comOrganizacao } from "../db/tenant";
import { protegerSenha } from "./senha";

export type Papel = "SST_ADMIN" | "SST_TECNICO" | "EMPRESA_RH";

/**
 * Cria o usuário e o vínculo com a organização numa transação só.
 *
 * Eram duas funções e duas transações. Se a segunda falhasse, sobrava um usuário
 * sem vínculo — e como `users.email` é único em toda a plataforma e a aplicação
 * não tem `update` nem `delete` naquela tabela, aquele e-mail ficava queimado em
 * definitivo, recuperável só por SQL manual do dono. Numa rota de cadastro isso
 * seria negação de serviço trivial: bastaria chamar o endpoint com e-mails
 * alheios para inutilizar cada um deles.
 *
 * Não existe mais uma função que vincule um `user_id` qualquer a uma organização.
 * Vincular alguém que já existe é ato que exige prova de convite, e o fluxo de
 * convite não existe nesta fase — deixar a porta aberta permitiria a uma
 * organização puxar para si uma pessoa de outra.
 *
 * O id é gerado aqui, e não pelo banco, para que o `insert` dispense
 * `returning id`. Sem `returning`, a aplicação não precisa de nenhum privilégio
 * de leitura em `users` — e sem ele não há como enumerar a base.
 */
export async function criarUsuarioComVinculo(
  pool: Pool,
  entrada: {
    email: string;
    senha: string;
    nome: string;
    organizationId: string;
    papel: Papel;
  },
): Promise<{ id: string }> {
  const id = randomUUID();
  const hash = await protegerSenha(entrada.senha);

  await comOrganizacao(pool, entrada.organizationId, async (client) => {
    await client.query(
      `insert into users (id, email, nome, senha_hash)
       values ($1, $2, $3, $4)`,
      [id, entrada.email.toLowerCase().trim(), entrada.nome, hash],
    );
    await client.query(
      `insert into org_members (organization_id, user_id, papel)
       values ($1, $2, $3)`,
      [entrada.organizationId, id, entrada.papel],
    );
  });

  return { id };
}
