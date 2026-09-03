import { config } from "dotenv";
import { criarPool } from "../db/client";
import { criarUsuarioComVinculo } from "../lib/usuarios";

config({ path: ".env.local", quiet: true });

const dono = criarPool(process.env.DATABASE_URL_OWNER!);
const app = criarPool(process.env.DATABASE_URL_APP!);

async function semear() {
  const email = process.argv[2];
  const nome = process.argv[3] ?? "Administrador";
  const senha = process.env.SEMEAR_SENHA;

  if (!email || !senha) {
    console.error('Uso: SEMEAR_SENHA="a-senha" npm run semear -- "email@dominio.com" "Nome"');
    console.error(
      "A senha vem por variável de ambiente, e não por argumento: argumento de\n" +
        "linha de comando fica no histórico do shell e na lista de processos.",
    );
    process.exit(1);
  }

  const { rows } = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria de Desenvolvimento', 'SST') returning id",
  );
  const organizationId = rows[0].id;

  const { id } = await criarUsuarioComVinculo(app, {
    email,
    senha,
    nome,
    organizationId,
    papel: "SST_ADMIN",
  });

  console.log(`Usuário criado: ${email}`);
  console.log(`Id do usuário: ${id}`);
  console.log(`Organização: ${organizationId}`);

  await dono.end();
  await app.end();
}

semear().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
