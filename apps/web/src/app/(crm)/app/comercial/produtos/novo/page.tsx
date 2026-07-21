"use client";

import { PageHeader } from "@/components/page-header";
import { Card, Label, Input, Textarea, Select } from "@pulso/ui";
import { useActionState } from "react";
import { createProduct, type ProductActionState } from "../actions";

const initialState: ProductActionState = {};

export default function NewProductPage() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo produto" description="Adicione um produto ou serviço ao catálogo." />
      <Card className="max-w-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--soft)] px-6 py-4">
          <h2 className="font-extrabold text-[var(--carbon)]">Dados do Produto</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Adicione um produto ou serviço ao catálogo.</p>
        </div>
        <form className="p-6 space-y-5" action={formAction}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input id="code" name="code" required placeholder="Ex: PROD-013" />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" required placeholder="Ex: Desenvolvimento" />
            </div>
          </div>
          <div>
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" name="name" required placeholder="Ex: Site Institucional" />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={3} placeholder="Descreva os detalhes do serviço ou produto..." />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="basePrice">Preço base (R$)</Label>
              <Input id="basePrice" name="basePrice" required inputMode="decimal" placeholder="1500,00" />
            </div>
            <div>
              <Label htmlFor="billingType">Tipo de Cobrança</Label>
              <Select id="billingType" name="billingType">
                <option value="one_time">Pagamento único</option>
                <option value="recurring">Recorrente</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="estimatedHours">Horas estimadas</Label>
              <Input id="estimatedHours" name="estimatedHours" inputMode="decimal" placeholder="Ex: 40" />
            </div>
            <div>
              <Label htmlFor="minimumMargin">Margem mínima (%)</Label>
              <Input id="minimumMargin" name="minimumMargin" inputMode="decimal" placeholder="Ex: 20" />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-[var(--carbon)] cursor-pointer">
            <input type="checkbox" name="allowBriefingSkip" className="size-4 rounded border-[var(--line)] text-[var(--signal)] focus:ring-[var(--signal)]" />
            Permite pular briefing (serviço simples)
          </label>
          {state.error && <p role="alert" className="rounded-xl border border-[var(--error)]/20 bg-[color:var(--error)/.08] px-4 py-3 text-sm font-semibold text-[var(--error)]">{state.error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
              {pending ? "Salvando..." : "Criar produto"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
