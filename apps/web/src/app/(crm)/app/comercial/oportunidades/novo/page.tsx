"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@pulso/ui";
import { useActionState } from "react";
import { createOpportunity, type OpportunityActionState } from "../actions";
import { ContactPicker } from "./contact-picker";

const initialState: OpportunityActionState = {};

export default function NewOpportunityPage() {
  const [state, formAction, pending] = useActionState(createOpportunity, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Nova oportunidade" description="Toda oportunidade aberta precisa de uma próxima ação definida." />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" action={formAction}>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="title">Título</label>
            <input id="title" name="title" required placeholder="Ex: Site institucional — Clínica Horizonte" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <ContactPicker />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="expectedValue">Valor previsto (R$)</label>
              <input id="expectedValue" name="expectedValue" inputMode="decimal" placeholder="0,00" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="source">Origem</label>
              <input id="source" name="source" defaultValue="manual" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="nextActionAt">Próxima ação (obrigatória)</label>
            <input id="nextActionAt" name="nextActionAt" type="datetime-local" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
          <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Salvando..." : "Criar oportunidade"}</button>
        </form>
      </Card>
    </>
  );
}
