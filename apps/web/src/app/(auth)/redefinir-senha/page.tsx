"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) { setError("Link inválido ou expirado."); return; }
    if (password.length < 12) { setError("A senha precisa ter no mínimo 12 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (resetError) { setError(resetError.message || "Não foi possível redefinir a senha."); return; }
    router.push("/login");
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.03em]">Nova senha</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Escolha uma senha com pelo menos 12 caracteres.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="password">Nova senha</label>
          <input id="password" type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="confirm">Confirmar senha</label>
          <input id="confirm" type="password" required minLength={12} value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{error}</p>}
        <button type="submit" disabled={loading} className="primary-button w-full justify-center">
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
