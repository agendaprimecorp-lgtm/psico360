"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { criarPool } from "@/db/client";
import { autenticar } from "@/lib/sessao";

const pool = criarPool(process.env.DATABASE_URL_APP!);

export async function entrar(_anterior: unknown, dados: FormData) {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");

  const sessao = await autenticar(pool, email, senha);
  if (!sessao) {
    // Mensagem unica para email inexistente e senha errada: dizer qual dos
    // dois falhou entrega a um atacante a lista de emails cadastrados.
    return { erro: "E-mail ou senha inválidos." };
  }

  const jar = await cookies();
  jar.set("psico360_sessao", sessao.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_COOKIE_SEGUNDOS,
  });

  redirect("/painel");
}

const DURACAO_COOKIE_SEGUNDOS = 12 * 60 * 60;
