"use client";

import { PageHeader } from "@/components/page-header";
import { Card, Label, Input } from "@pulso/ui";
import { useActionState } from "react";
import { createOpportunity, type OpportunityActionState } from "../actions";
import { ContactPicker } from "./contact-picker";

const initialState: OpportunityActionState = {};

export default function NewOpportunityPage() {
  const [state, formAction, pending] = useActionState(createOpportunity, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Nova oportunidade" description="Toda oportunidade aberta precisa de uma próxima ação definida." />
      <Card className="max-w-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--soft)] px-6 py-4">
          <h2 className="font-extrabold text-[var(--carbon)]">Dados da Oportunidade</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Toda oportunidade aberta precisa de uma próxima ação definida.</p>
        </div>
        <form className="p-6 space-y-5" action={formAction}>
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required placeholder="Ex: Site institucional — Clínica Horizonte" />
          </div>
          <ContactPicker />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="expectedValue">Valor previsto (R$)</Label>
              <Input id="expectedValue" name="expectedValue" inputMode="decimal" placeholder="0,00" />
            </div>
            <div>
              <Label htmlFor="source">Origem</Label>
              <Input id="source" name="source" defaultValue="manual" placeholder="Ex: Prospecção" />
            </div>
          </div>
          <div>
            <Label htmlFor="nextActionAt">Próxima ação (obrigatória)</Label>
            <Input id="nextActionAt" name="nextActionAt" type="datetime-local" required />
          </div>
          {state.error && <p role="alert" className="rounded-xl border border-[#b3261e]/20 bg-[color:#b3261e/.08] px-4 py-3 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
              {pending ? "Salvando..." : "Criar oportunidade"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
