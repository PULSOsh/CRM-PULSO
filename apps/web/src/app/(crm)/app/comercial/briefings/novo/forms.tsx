"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import { createBriefing, skipBriefing, type BriefingActionState } from "../actions";
import { OpportunityPicker } from "./opportunity-picker";

const initialState: BriefingActionState = {};

export function CreateBriefingForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createBriefing, initialState);
  const [copied, setCopied] = useState(false);

  if (state.link) {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${state.link}` : state.link;
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-5">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--signal)]"><Check className="size-4" />Briefing {state.code} criado</div>
        <p className="mt-2 text-sm text-[var(--muted)]">Copie o link abaixo e envie ao cliente. Ele não será mostrado novamente — se perder, use &quot;Regenerar link&quot; na lista de briefings.</p>
        <div className="mt-3 flex items-center gap-2">
          <input readOnly value={fullUrl} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs outline-none" />
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(fullUrl); setCopied(true); }}
            className="secondary-button shrink-0"
          >
            <Copy className="size-4" />{copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" action={formAction}>
      <OpportunityPicker />
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="productId">Produto (opcional)</label>
        <select id="productId" name="productId" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
          <option value="">Não especificado</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Gerando..." : "Gerar link do briefing"}</button>
    </form>
  );
}

export function SkipBriefingForm({ eligibleProducts }: { eligibleProducts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(skipBriefing, initialState);

  if (eligibleProducts.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Nenhum produto está marcado como elegível para pular o briefing.</p>;
  }

  if (state.code) {
    return <p className="text-sm font-semibold text-[var(--signal)]">Briefing {state.code} registrado como pulado.</p>;
  }

  return (
    <form className="space-y-4" action={formAction}>
      <OpportunityPicker />
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="skip-productId">Produto elegível</label>
        <select id="skip-productId" name="productId" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
          <option value="">Selecione</option>
          {eligibleProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="reason">Justificativa (obrigatória, auditada)</label>
        <textarea id="reason" name="reason" required rows={2} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
      <button type="submit" disabled={pending} className="secondary-button w-full justify-center sm:w-auto">{pending ? "Registrando..." : "Pular briefing"}</button>
    </form>
  );
}
