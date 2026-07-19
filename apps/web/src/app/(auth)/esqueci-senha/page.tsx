"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/redefinir-senha" });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Verifique seu e-mail</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Em modo de desenvolvimento, o link aparece no log do servidor.
        </p>
        <a href="/login" className="secondary-button mt-6 w-full justify-center">Voltar ao login</a>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Recuperar senha</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Enviaremos um link seguro para o seu e-mail cadastrado.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
          <input
            id="email" type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
          />
        </div>
        <button type="submit" disabled={loading} className="primary-button w-full justify-center">
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
      <a href="/login" className="mt-4 block text-center text-sm font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Voltar ao login</a>
    </>
  );
}
