"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export default function Entrar() {
  const [estado, acao, pendente] = useActionState(entrar, null);

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h1>PSICO360</h1>
      <form action={acao}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
        />

        {estado?.erro ? <p role="alert">{estado.erro}</p> : null}

        <button type="submit" disabled={pendente}>
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
