"use client";

import { useActionState } from "react";
import type { FinancialActionState } from "./actions";

const initialState: FinancialActionState = {};

export function NewEntryForm({
  action, showDirection, submitLabel
}: {
  action: (prev: FinancialActionState, formData: FormData) => Promise<FinancialActionState>;
  showDirection?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {showDirection && (
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="direction">Tipo</label>
          <select id="direction" name="direction" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
            <option value="in">Receita</option>
            <option value="out">Despesa</option>
          </select>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="description">Descrição</label>
        <input id="description" name="description" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="category">Categoria (opcional)</label>
          <input id="category" name="category" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="amountExpected">Valor (R$)</label>
          <input id="amountExpected" name="amountExpected" required inputMode="decimal" placeholder="0,00" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="competenceDate">Competência</label>
          <input id="competenceDate" name="competenceDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="dueDate">Vencimento (opcional)</label>
          <input id="dueDate" name="dueDate" type="date" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Salvando..." : submitLabel}</button>
    </form>
  );
}
