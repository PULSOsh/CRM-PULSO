"use client";

import type { schema } from "@pulso/database";
import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { saveDraftVersion, type ProposalActionState } from "../actions";

type ProposalContent = schema.ProposalContent;
const initialState: ProposalActionState = {};

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function ProposalEditor({
  proposalId, versionId, initialContent, initialValidUntil
}: {
  proposalId: string; versionId: string; initialContent: ProposalContent; initialValidUntil: string | null;
}) {
  const [content, setContent] = useState<ProposalContent>(initialContent);
  const [validUntil, setValidUntil] = useState(initialValidUntil ?? "");
  const boundAction = saveDraftVersion.bind(null, proposalId, versionId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const subtotal = content.scopeItems.reduce((s, i) => s + i.price, 0);

  function addItem(list: "scopeItems" | "addons") {
    const id = `${list}-${Date.now()}`;
    setContent((c) => ({ ...c, [list]: [...c[list], { id, label: "", price: 0 }] }));
  }
  function updateItem(list: "scopeItems" | "addons", id: string, patch: Partial<{ label: string; price: number; description: string }>) {
    setContent((c) => ({ ...c, [list]: c[list].map((i) => i.id === id ? { ...i, ...patch } : i) }));
  }
  function removeItem(list: "scopeItems" | "addons", id: string) {
    setContent((c) => ({ ...c, [list]: c[list].filter((i) => i.id !== id) }));
  }

  function addPaymentCondition() {
    const id = `cond-${Date.now()}`;
    setContent((c) => ({ ...c, paymentConditions: [...c.paymentConditions, { id, label: "", installments: 1 }] }));
  }
  function updateCondition(id: string, patch: Partial<{ label: string; installments: number }>) {
    setContent((c) => ({ ...c, paymentConditions: c.paymentConditions.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  }
  function removeCondition(id: string) {
    setContent((c) => ({ ...c, paymentConditions: c.paymentConditions.filter((p) => p.id !== id) }));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="content" value={JSON.stringify({ ...content, validUntil })} />

      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="intro">Introdução</label>
        <textarea id="intro" rows={2} value={content.intro} onChange={(e) => setContent((c) => ({ ...c, intro: e.target.value }))}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="context">Contexto entendido</label>
        <textarea id="context" rows={3} value={content.context} onChange={(e) => setContent((c) => ({ ...c, context: e.target.value }))}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--muted-strong)]">Itens de escopo (compõem o valor total)</label>
          <button type="button" onClick={() => addItem("scopeItems")} className="secondary-button px-3 py-1.5 text-xs"><Plus className="size-3.5" />Adicionar item</button>
        </div>
        <div className="space-y-2">
          {content.scopeItems.map((item) => (
            <div key={item.id} className="flex gap-2">
              <input value={item.label} onChange={(e) => updateItem("scopeItems", item.id, { label: e.target.value })} placeholder="Descrição do item"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
              <input type="number" step="0.01" value={item.price} onChange={(e) => updateItem("scopeItems", item.id, { price: Number(e.target.value) })} placeholder="Preço"
                className="w-32 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
              <button type="button" onClick={() => removeItem("scopeItems", item.id)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-[#b3261e]"><Trash2 className="size-4" /></button>
            </div>
          ))}
          {content.scopeItems.length === 0 && <p className="text-xs text-[var(--muted)]">Nenhum item adicionado ainda.</p>}
        </div>
        <p className="mt-2 text-sm font-bold">Subtotal: <span className="money-value">{currency(subtotal)}</span></p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--muted-strong)]">Adicionais opcionais (cliente escolhe)</label>
          <button type="button" onClick={() => addItem("addons")} className="secondary-button px-3 py-1.5 text-xs"><Plus className="size-3.5" />Adicionar</button>
        </div>
        <div className="space-y-2">
          {content.addons.map((addon) => (
            <div key={addon.id} className="flex gap-2">
              <input value={addon.label} onChange={(e) => updateItem("addons", addon.id, { label: e.target.value })} placeholder="Nome do adicional"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
              <input type="number" step="0.01" value={addon.price} onChange={(e) => updateItem("addons", addon.id, { price: Number(e.target.value) })} placeholder="Preço"
                className="w-32 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
              <button type="button" onClick={() => removeItem("addons", addon.id)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-[#b3261e]"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--muted-strong)]">Condições de pagamento</label>
          <button type="button" onClick={addPaymentCondition} className="secondary-button px-3 py-1.5 text-xs"><Plus className="size-3.5" />Adicionar</button>
        </div>
        <div className="space-y-2">
          {content.paymentConditions.map((cond) => (
            <div key={cond.id} className="flex gap-2">
              <input value={cond.label} onChange={(e) => updateCondition(cond.id, { label: e.target.value })} placeholder="Ex: 3x sem juros"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
              <input type="number" value={cond.installments} onChange={(e) => updateCondition(cond.id, { installments: Number(e.target.value) })} placeholder="Parcelas"
                className="w-28 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
              <button type="button" onClick={() => removeCondition(cond.id)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--line)] text-[var(--muted)] hover:text-[#b3261e]"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="validUntil">Válida até</label>
        <input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>

      {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" name="action" value="save" disabled={pending} className="secondary-button">{pending ? "Processando..." : "Salvar rascunho"}</button>
        <button type="submit" name="action" value="publish" disabled={pending} className="primary-button">{pending ? "Processando..." : "Salvar e Publicar"}</button>
      </div>
    </form>
  );
}
