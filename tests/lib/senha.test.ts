import { describe, expect, it } from "vitest";
import { conferirSenha, protegerSenha } from "@/lib/senha";

describe("proteção de senha", () => {
  it("não guarda a senha em claro", async () => {
    const hash = await protegerSenha("senha-de-teste-123");
    expect(hash).not.toContain("senha-de-teste-123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("confere a senha correta", async () => {
    const hash = await protegerSenha("senha-de-teste-123");
    expect(await conferirSenha(hash, "senha-de-teste-123")).toBe(true);
  });

  it("recusa a senha errada", async () => {
    const hash = await protegerSenha("senha-de-teste-123");
    expect(await conferirSenha(hash, "senha-errada")).toBe(false);
  });

  it("gera hashes diferentes para a mesma senha", async () => {
    const a = await protegerSenha("mesma-senha");
    const b = await protegerSenha("mesma-senha");
    expect(a).not.toBe(b);
  });
});
