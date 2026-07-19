"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@pulso/ui";
import { useActionState } from "react";
import { createCompany, type CompanyActionState } from "../../actions";

const initialState: CompanyActionState = {};

export default function NewCompanyPage() {
  const [state, formAction, pending] = useActionState(createCompany, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Nova empresa" description="Registre uma empresa cliente ou parceira." />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" action={formAction}>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="tradeName">Nome fantasia</label>
            <input id="tradeName" name="tradeName" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="legalName">Razão social</label>
            <input id="legalName" name="legalName" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="document">CNPJ</label>
              <input id="document" name="document" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="segment">Segmento</label>
              <input id="segment" name="segment" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="website">Site</label>
            <input id="website" name="website" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="notes">Notas</label>
            <textarea id="notes" name="notes" rows={3} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          {state.error && (
            <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">
              {state.error}{state.duplicateId && <a href={`/app/comercial/contatos/empresas/${state.duplicateId}`} className="ml-2 underline">Ver empresa existente</a>}
            </p>
          )}
          <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Salvando..." : "Criar empresa"}</button>
        </form>
      </Card>
    </>
  );
}
