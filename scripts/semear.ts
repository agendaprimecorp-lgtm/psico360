import { config } from "dotenv";
import { criarPool } from "../db/client";
import { criarUsuario, vincular } from "../lib/usuarios";

config({ path: ".env.local" });

const dono = criarPool(process.env.DATABASE_URL_OWNER!);
const app = criarPool(process.env.DATABASE_URL_APP!);

async function semear() {
  const email = process.argv[2];
  const senha = process.argv[3];
  const nome = process.argv[4] ?? "Administrador";

  if (!email || !senha) {
    console.error('Uso: npm run semear -- "email@dominio.com" "senha" "Nome"');
    process.exit(1);
  }

  const { rows } = await dono.query(
    "insert into organizations (nome, tipo) values ('Consultoria de Desenvolvimento', 'SST') returning id",
  );
  const organizationId = rows[0].id;

  const { id } = await criarUsuario(app, { email, senha, nome });
  await vincular(app, { userId: id, organizationId, papel: "SST_ADMIN" });

  console.log(`Usuário criado: ${email}`);
  console.log(`Organização: ${organizationId}`);

  await dono.end();
  await app.end();
}

semear().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
