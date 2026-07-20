"use client";

import { useActionState } from "react";
import { CompanyPicker } from "@/components/company-picker";
import { invitePortalUser, searchCompaniesForPortal } from "../actions";

const initialState: { error?: string } = {};

export function InviteForm() {
  const [state, formAction, pending] = useActionState(invitePortalUser, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <CompanyPicker searchAction={searchCompaniesForPortal} />
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
        <input id="name" name="name" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{state.error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Enviando..." : "Gerar convite"}</button>
    </form>
  );
}
