"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@pulso/ui";
import { useActionState } from "react";
import { createProduct, type ProductActionState } from "../actions";

const initialState: ProductActionState = {};

export default function NewProductPage() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo produto" description="Adicione um produto ou serviço ao catálogo." />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" action={formAction}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="code">Código</label>
              <input id="code" name="code" required placeholder="PROD-013" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="category">Categoria</label>
              <input id="category" name="category" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
            <input id="name" name="name" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="description">Descrição</label>
            <textarea id="description" name="description" rows={3} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="basePrice">Preço base (R$)</label>
              <input id="basePrice" name="basePrice" required inputMode="decimal" placeholder="1500,00" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="billingType">Cobrança</label>
              <select id="billingType" name="billingType" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
                <option value="one_time">Pagamento único</option>
                <option value="recurring">Recorrente</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="estimatedHours">Horas estimadas</label>
              <input id="estimatedHours" name="estimatedHours" inputMode="decimal" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="minimumMargin">Margem mínima (%)</label>
              <input id="minimumMargin" name="minimumMargin" inputMode="decimal" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="allowBriefingSkip" className="size-4" />
            Permite pular briefing (serviço simples)
          </label>
          {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
          <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Salvando..." : "Criar produto"}</button>
        </form>
      </Card>
    </>
  );
}
