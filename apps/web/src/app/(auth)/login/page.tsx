"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/app/hoje";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === "Invalid password" || signInError.status === 401
        ? "E-mail ou senha incorretos."
        : signInError.message || "Não foi possível entrar. Tente novamente.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Entrar</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Acesso restrito ao administrador interno da PULSO.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
          <input
            id="email" type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="password">Senha</label>
          <input
            id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
          />
        </div>
        {error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{error}</p>}
        <button type="submit" disabled={loading} className="primary-button w-full justify-center">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <a href="/esqueci-senha" className="mt-4 block text-center text-sm font-bold text-[var(--muted)] hover:text-[var(--carbon)]">
        Esqueci minha senha
      </a>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
