"use client";

import type { schema } from "@pulso/database";
import { useActionState } from "react";
import { updateCompany, type CompanyActionState } from "../../actions";

const initialState: CompanyActionState = {};
type Company = typeof schema.companies.$inferSelect;

export function CompanyEditForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateCompany.bind(null, company.id), initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="tradeName">Nome fantasia</label>
        <input id="tradeName" name="tradeName" defaultValue={company.tradeName} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="legalName">Razão social</label>
        <input id="legalName" name="legalName" defaultValue={company.legalName ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="document">CNPJ</label>
          <input id="document" name="document" defaultValue={company.document ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="segment">Segmento</label>
          <input id="segment" name="segment" defaultValue={company.segment ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="website">Site</label>
        <input id="website" name="website" defaultValue={company.website ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={company.notes ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{state.error}</p>}
      <button type="submit" disabled={pending} className="primary-button">{pending ? "Salvando..." : "Salvar alterações"}</button>
    </form>
  );
}
