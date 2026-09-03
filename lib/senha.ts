import argon2 from "argon2";

export async function protegerSenha(senha: string): Promise<string> {
  return argon2.hash(senha, { type: argon2.argon2id });
}

export async function conferirSenha(
  hash: string,
  senha: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, senha);
  } catch {
    return false;
  }
}
