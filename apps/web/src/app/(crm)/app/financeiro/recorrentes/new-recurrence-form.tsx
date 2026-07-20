"use client";

import { Button } from "@pulso/ui";
import { useActionState } from "react";
import { type ActionState } from "./actions";

export function NewRecurrenceForm({ action, submitLabel }: { action: (prev: ActionState, formData: FormData) => Promise<ActionState>, submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[var(--muted)]">Descrição</label>
        <input name="description" required className="rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" placeholder="Ex: Aluguel do escritório" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[var(--muted)]">Valor</label>
        <input name="amount" required type="number" step="0.01" className="rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" placeholder="Ex: 1500.00" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[var(--muted)]">Direção</label>
        <select name="direction" required className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm">
          <option value="expense">Saída (Despesa Mensal)</option>
          <option value="income">Entrada (Receita Recorrente)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[var(--muted)]">Categoria</label>
        <input name="type" required defaultValue="fixed" className="rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" placeholder="Ex: fixed" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[var(--muted)]">Data de Início</label>
        <input name="startDate" required type="date" className="rounded-lg border border-[var(--line)] bg-transparent p-2 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[var(--muted)]">Frequência</label>
        <select name="frequency" required className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm">
          <option value="monthly">Mensal</option>
          <option value="weekly">Semanal</option>
          <option value="yearly">Anual</option>
        </select>
      </div>

      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Criando..." : submitLabel}
        </Button>
      </div>
      
      {state?.error && <div className="col-span-full text-xs text-rose-500">{state.error}</div>}
      {state?.success && <div className="col-span-full text-xs text-emerald-500">Recorrência criada com sucesso! Atualize a página.</div>}
    </form>
  );
}
