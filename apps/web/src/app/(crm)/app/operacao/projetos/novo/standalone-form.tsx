"use client";

import { useActionState } from "react";
import { Card } from "@pulso/ui";
import { createStandaloneProject } from "../actions";
import { FolderPlus, Loader2 } from "lucide-react";

export function StandaloneProjectForm() {
  const [state, formAction, pending] = useActionState(createStandaloneProject, { error: undefined });

  return (
    <Card className="p-6 border border-[var(--line)] bg-[var(--surface)] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <FolderPlus className="size-5 text-[var(--signal)]" />
        <h3 className="font-extrabold text-base text-[var(--text)]">Criar Projeto Avulso</h3>
      </div>
      <p className="text-xs text-[var(--muted)] mb-5">
        Cadastre um projeto diretamente na operação sem necessidade de vincular a um contrato comercial prévio.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="name">
            Nome do Projeto *
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ex: Redesign de Marca e Website - Cliente X"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="budget">
            Orçamento Previsto (R$)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="description">
            Descrição / Escopo do Projeto
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Detalhes dos entregáveis e objetivos..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-[color:var(--error)/.08] p-3 text-xs font-bold text-[var(--error)]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-4 py-3 font-bold text-sm text-white shadow-md hover:bg-orange-600 transition-all disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Criando projeto...
            </>
          ) : (
            "Criar Projeto Avulso"
          )}
        </button>
      </form>
    </Card>
  );
}
