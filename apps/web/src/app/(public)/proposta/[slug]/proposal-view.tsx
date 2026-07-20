"use client";

import type { schema } from "@pulso/database";
import { Check, ChevronRight, Clock3, FileText, ShieldCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { acceptProposal, rejectProposal, requestAlternativeCondition } from "./actions";

type Version = typeof schema.proposalVersions.$inferSelect;
type Proposal = typeof schema.proposals.$inferSelect;

export function ProposalView({ proposal, version, token, opportunityTitle }: {
  proposal: Proposal; version: Version; token: string; opportunityTitle: string;
}) {
  const content = version.content;
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentId, setPaymentId] = useState(content.paymentConditions[0]?.id ?? "");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [mode, setMode] = useState<"view" | "alt-requested">("view");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = content.scopeItems.reduce((s, i) => s + i.price, 0);
  const addonsTotal = useMemo(() => selectedAddons.reduce((s, id) => s + (content.addons.find((a) => a.id === id)?.price ?? 0), 0), [selectedAddons, content.addons]);
  const total = subtotal + addonsTotal;
  const selectedPayment = content.paymentConditions.find((p) => p.id === paymentId);

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  }

  function handleAccept() {
    setError(null);
    if (!name.trim()) { setError("Informe seu nome completo."); return; }
    if (!declaration) { setError("Confirme a declaração de aceite."); return; }
    startTransition(async () => {
      try {
        // Ao aceitar com sucesso, o Server Action revalida a rota automaticamente e o
        // Server Component (page.tsx) passa a renderizar a tela de "proposta já aceita" —
        // não precisa de estado local aqui (mesmo padrão do briefing).
        await acceptProposal(proposal.id, version.id, token, { name, document, paymentConditionId: paymentId, selectedAddonIds: selectedAddons, declaration });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível registrar o aceite.");
      }
    });
  }

  function handleReject() {
    const reason = window.prompt("Pode nos dizer o motivo? (opcional)") ?? "";
    startTransition(async () => {
      await rejectProposal(proposal.id, token, reason);
    });
  }

  function handleAlternative() {
    const entry = window.prompt("Valor de entrada desejado (opcional, em R$):") ?? "";
    const installments = Number(window.prompt("Em quantas parcelas?") ?? "1");
    const comment = window.prompt("Comentário adicional (opcional):") ?? "";
    if (!installments) return;
    startTransition(async () => {
      await requestAlternativeCondition(proposal.id, version.id, token, { label: `Condição alternativa (${installments}x)`, entry, installments, comment });
      setMode("alt-requested");
    });
  }


  return (
    <main>
      {mode === "alt-requested" && (
        <div className="bg-[var(--signal)] px-4 py-3 text-center text-sm font-bold text-white">Pedido enviado! A proposta atual continua válida até recebermos uma resposta.</div>
      )}
      <section className="bg-[var(--carbon)] px-4 py-16 text-[var(--paper)] md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{proposal.code} · Versão {version.version}</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm text-[var(--neutral)]">Proposta para {opportunityTitle}</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.055em] md:text-6xl">{content.scopeTitle || "Sua proposta comercial"}</h1>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <p className="text-xs font-bold text-[var(--neutral)]">Investimento a partir de</p>
              <p className="money-value mt-2 text-4xl font-black">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(subtotal)}</p>
              {proposal.validUntil && <p className="mt-3 flex items-center gap-2 text-xs text-[var(--neutral)]"><Clock3 className="size-4" />Válida até {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}</p>}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            {content.context && (
              <article>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--signal)]">Contexto entendido</p>
                <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">{content.context}</p>
              </article>
            )}
            <article>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--signal)]">Escopo</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.05em]">{content.scopeTitle}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {content.scopeItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 font-bold">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--signal)] text-white"><Check className="size-3.5" /></span>{item.label}
                  </div>
                ))}
              </div>
            </article>
            {content.addons.length > 0 && (
              <article>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--signal)]">Adicionais</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-.05em]">Personalize a solução</h2>
                <div className="mt-6 space-y-3">
                  {content.addons.map((addon) => {
                    const active = selectedAddons.includes(addon.id);
                    return (
                      <button key={addon.id} type="button" onClick={() => toggleAddon(addon.id)}
                        className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left ${active ? "border-[var(--signal)] bg-[color:var(--signal)/.06]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
                        <span className={`grid size-6 shrink-0 place-items-center rounded-md border ${active ? "border-[var(--signal)] bg-[var(--signal)] text-white" : "border-[var(--line)]"}`}>{active && <Check className="size-3.5" />}</span>
                        <span className="flex-1 font-bold">{addon.label}</span>
                        <span className="money-value font-black">+ {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-extrabold">Resumo e aceite</h2>
            <div className="mt-4 space-y-3 border-y border-[var(--line)] py-4 text-sm">
              {content.scopeItems.map((item) => <div key={item.id} className="flex justify-between"><span className="text-[var(--muted)]">{item.label}</span><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price)}</strong></div>)}
              {selectedAddons.map((id) => { const a = content.addons.find((x) => x.id === id)!; return <div key={id} className="flex justify-between"><span className="text-[var(--muted)]">{a.label}</span><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(a.price)}</strong></div>; })}
            </div>

            {content.paymentConditions.length > 0 && (
              <label className="mt-4 block text-xs font-bold text-[var(--muted)]">
                Condição de pagamento
                <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 font-bold">
                  {content.paymentConditions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
            )}

            <div className="mt-5 flex items-end justify-between">
              <div><p className="text-xs text-[var(--muted)]">Total selecionado</p><p className="money-value mt-1 text-3xl font-black tracking-[-.05em]">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}</p></div>
              {selectedPayment && selectedPayment.installments > 1 && <p className="money-value text-xs font-bold text-[var(--muted)]">{selectedPayment.installments}x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total / selectedPayment.installments)}</p>}
            </div>

            <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm outline-none focus:border-[var(--signal)]" />
              <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF/CNPJ (opcional)" className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm outline-none focus:border-[var(--signal)]" />
              <label className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
                <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-0.5 size-4 shrink-0" />
                Declaro que li e aceito os termos, escopo e condições desta proposta.
              </label>
            </div>

            {error && <p role="alert" className="mt-3 rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-xs font-semibold text-[#b3261e]">{error}</p>}

            <button onClick={handleAccept} disabled={pending} className="primary-button mt-5 w-full">Aceitar proposta <ChevronRight className="size-4" /></button>
            <button onClick={handleAlternative} disabled={pending} className="secondary-button mt-2 w-full">Solicitar outra condição</button>
            <button onClick={handleReject} disabled={pending} className="mt-2 w-full text-center text-xs font-bold text-[var(--muted)] hover:text-[#b3261e]">Recusar proposta</button>

            <div className="mt-5 space-y-2 text-xs text-[var(--muted)]">
              <p className="flex items-center gap-2"><ShieldCheck className="size-4" />Aceite com identificação e evidências.</p>
              <p className="flex items-center gap-2"><FileText className="size-4" />Registro completo, com data, hora e IP.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
