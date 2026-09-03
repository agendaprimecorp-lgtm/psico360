import { afterAll, describe, expect, it } from "vitest";
import { criarPool } from "@/db/client";

const dono = criarPool(process.env.DATABASE_URL_TEST_OWNER!);

afterAll(async () => {
  await dono.end();
});

describe("conexão com o banco", () => {
  it("responde a uma consulta trivial", async () => {
    const { rows } = await dono.query("select 1 as um");
    expect(rows[0].um).toBe(1);
  });

  it("possui a tabela organizations", async () => {
    const { rows } = await dono.query(
      "select to_regclass('public.organizations') as tabela",
    );
    expect(rows[0].tabela).toBe("organizations");
  });
});
