"use client";

import { useActionState } from "react";
import { portalLogin } from "../actions";

const initialState: { error?: string } = {};

export default function PortalLoginPage() {
  const [state, formAction, pending] = useActionState(portalLogin, initialState);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-10">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">Portal do cliente</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">Entrar</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Acesso por convite — sem cadastro público.</p>
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="username" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        {state.error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{state.error}</p>}
        <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  );
}
