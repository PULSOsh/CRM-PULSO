"use client";

import { useActionState } from "react";
import { createProspectingList } from "../actions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@pulso/ui";

export default function NovoProspectingPage() {
  const [state, formAction, pending] = useActionState(createProspectingList, {});

  return (
    <>
      <PageHeader
        eyebrow="Prospecção"
        title="Nova lista"
        description="Crie um novo agrupamento de contatos para prospectar."
      />
      <div className="mt-6 max-w-xl">
        <Card className="p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]">Nome da lista</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
                placeholder="Ex: Clínicas Odontológicas - Ceará"
              />
            </div>
            <div>
              <label htmlFor="description" className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]">Descrição (opcional)</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]"
                placeholder="Detalhes sobre a origem ou objetivo desta lista..."
              />
            </div>
            
            {state.error && (
              <p className="text-sm font-semibold text-[var(--error)]">{state.error}</p>
            )}
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={pending}
                className="primary-button w-full"
              >
                {pending ? "Criando..." : "Criar lista"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
