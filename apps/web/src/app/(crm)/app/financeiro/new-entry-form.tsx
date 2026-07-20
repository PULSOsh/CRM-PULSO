"use client";

import { useActionState } from "react";
import { Label, Input, Select } from "@pulso/ui";
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
    <form action={formAction} className="space-y-5">
      {showDirection && (
        <div>
          <Label htmlFor="direction">Tipo de Lançamento</Label>
          <Select id="direction" name="direction">
            <option value="in">Receita</option>
            <option value="out">Despesa</option>
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" required placeholder="Ex: Pagamento de honorários" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Categoria (opcional)</Label>
          <Input id="category" name="category" placeholder="Ex: Serviços" />
        </div>
        <div>
          <Label htmlFor="amountExpected">Valor (R$)</Label>
          <Input id="amountExpected" name="amountExpected" required inputMode="decimal" placeholder="0,00" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="competenceDate">Competência</Label>
          <Input id="competenceDate" name="competenceDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <Label htmlFor="dueDate">Vencimento (opcional)</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="repeatMonths">Recorrência mensal (opcional)</Label>
        <Input id="repeatMonths" name="repeatMonths" type="number" min="1" max="60" placeholder="Ex: 12 (repete por 12 meses)" />
        <p className="mt-1 text-xs text-[var(--muted)]">Deixe em branco para lançamento único. Se preenchido, irá gerar as parcelas para os próximos meses.</p>
      </div>
      {state.error && <p role="alert" className="rounded-xl border border-[#b3261e]/20 bg-[color:#b3261e/.08] px-4 py-3 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
      <div className="pt-2">
        <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
          {pending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
