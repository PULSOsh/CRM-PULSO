"use client";

import type { schema } from "@pulso/database";
import { useActionState } from "react";
import { updateProduct, type ProductActionState } from "../actions";

const initialState: ProductActionState = {};
type Product = typeof schema.products.$inferSelect;

export function ProductEditForm({ product }: { product: Product }) {
  const [state, formAction, pending] = useActionState(updateProduct.bind(null, product.id), initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="code">Código</label>
          <input id="code" name="code" defaultValue={product.code} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="category">Categoria</label>
          <input id="category" name="category" defaultValue={product.category} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
        <input id="name" name="name" defaultValue={product.name} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="description">Descrição</label>
        <textarea id="description" name="description" rows={3} defaultValue={product.description ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="basePrice">Preço base (R$)</label>
          <input id="basePrice" name="basePrice" defaultValue={product.basePrice} required inputMode="decimal" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="billingType">Cobrança</label>
          <select id="billingType" name="billingType" defaultValue={product.billingType} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
            <option value="one_time">Pagamento único</option>
            <option value="recurring">Recorrente</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="estimatedHours">Horas estimadas</label>
          <input id="estimatedHours" name="estimatedHours" defaultValue={product.estimatedHours} inputMode="decimal" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="minimumMargin">Margem mínima (%)</label>
          <input id="minimumMargin" name="minimumMargin" defaultValue={product.minimumMargin} inputMode="decimal" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="allowBriefingSkip" defaultChecked={product.allowBriefingSkip} className="size-4" />
        Permite pular briefing (serviço simples)
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{state.error}</p>}
      <button type="submit" disabled={pending} className="primary-button">{pending ? "Salvando..." : "Salvar alterações"}</button>
    </form>
  );
}
