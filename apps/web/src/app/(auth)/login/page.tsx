"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Input, Label, Button } from "@pulso/ui";

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
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email" type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
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
