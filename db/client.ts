import { Pool } from "pg";

export function criarPool(connectionString: string): Pool {
  if (!connectionString) {
    throw new Error(
      "String de conexão ausente. Confira as quatro DATABASE_URL_* em .env.local",
    );
  }
  return new Pool({ connectionString, max: 5 });
}
