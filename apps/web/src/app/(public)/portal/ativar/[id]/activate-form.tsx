"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { activatePortalUserAccount } from "../../actions";

export function ActivateForm({ portalUserId, token }: { portalUserId: string; token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    startTransition(async () => {
      try {
        await activatePortalUserAccount(portalUserId, token, password);
        router.push("/portal/login");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível ativar a conta.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="password">Nova senha</label>
        <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="confirm">Confirmar senha</label>
        <input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Ativando..." : "Ativar conta"}</button>
    </form>
  );
}
