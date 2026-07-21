"use client";

import type { schema } from "@pulso/database";
import { Check, ChevronRight, Clock3, FileText, ShieldCheck, Zap } from "lucide-react";
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
    <main className="font-sans antialiased text-white bg-[#11110f] min-h-screen selection:bg-[var(--signal)]/30">
      {mode === "alt-requested" && (
        <div className="bg-[var(--signal)] px-4 py-3 text-center text-sm font-bold text-white z-50 sticky top-0">
          Pedido enviado! A proposta atual continua válida até recebermos uma resposta.
        </div>
      )}
      
      {/* Immersive Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 md:py-32 lg:py-40 bg-gradient-to-b from-[#11110f] via-black to-[#11110f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/20 via-black/0 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 w-1/3 h-1/2 bg-[var(--signal)]/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative mx-auto max-w-6xl z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--signal)]/30 bg-[var(--signal)]/10 text-orange-400 font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
            <Zap className="size-3.5 fill-orange-500/50" />
            Proposta Comercial
          </div>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-4">Para {opportunityTitle}</p>
          <h1 className="max-w-4xl mx-auto text-5xl font-black tracking-tighter md:text-7xl lg:text-8xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
            {content.scopeTitle || "Sua proposta comercial"}
          </h1>
          
          <div className="mt-12 inline-block rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Investimento a partir de</p>
            <p className="money-value mt-2 text-5xl font-black text-white">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(subtotal)}</p>
            {proposal.validUntil && (
              <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[var(--signal)]/80 bg-[var(--signal)]/10 px-3 py-1.5 rounded-full">
                <Clock3 className="size-4" /> Válida até {new Date(proposal.validUntil).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-16">
            
            {content.context && (
              <article className="prose prose-invert prose-lg max-w-none">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-[2px] w-8 bg-[var(--signal)]" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[var(--signal)]">Contexto entendido</p>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white mb-6">Onde estamos agora</h2>
                <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">{content.context}</div>
              </article>
            )}
            
            {content.intro && (
              <article className="prose prose-invert prose-lg max-w-none">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-[2px] w-8 bg-[var(--signal)]" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[var(--signal)]">Nossa Solução</p>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white mb-6">Como vamos resolver isso</h2>
                <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">{content.intro}</div>
              </article>
            )}

            <article>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[2px] w-8 bg-[var(--signal)]" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[var(--signal)]">Escopo</p>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-8">O que está incluído</h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {content.scopeItems.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-white/20">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Check className="size-16 text-white" />
                    </div>
                    <div className="relative z-10">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--signal)]/20 text-[var(--signal)] mb-4">
                        <Check className="size-4 font-bold" />
                      </span>
                      <h3 className="text-lg font-bold text-white mb-2">{item.label}</h3>
                      {item.description && <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {content.addons.length > 0 && (
              <article>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-[2px] w-8 bg-[var(--signal)]" />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[var(--signal)]">Adicionais</p>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white mb-8">Turbine a solução</h2>
                <div className="space-y-3">
                  {content.addons.map((addon) => {
                    const active = selectedAddons.includes(addon.id);
                    return (
                      <button key={addon.id} type="button" onClick={() => toggleAddon(addon.id)}
                        className={`flex w-full items-center gap-5 rounded-2xl border p-5 text-left transition-all duration-300 ${active ? "border-[var(--signal)]/50 bg-[var(--signal)]/10 shadow-[0_0_30px_rgba(249,115,22,0.15)]" : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}>
                        <span className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors ${active ? "border-[var(--signal)] bg-[var(--signal)] text-white" : "border-white/20"}`}>
                          {active && <Check className="size-4" />}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-bold text-white">{addon.label}</h3>
                          {addon.description && <p className="text-xs text-gray-400 mt-1">{addon.description}</p>}
                        </div>
                        <span className="money-value text-lg font-black text-white whitespace-nowrap">
                          + {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(addon.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </article>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-black/50 p-8 shadow-2xl lg:sticky lg:top-8 relative overflow-hidden">
            {/* Ambient glow in sidebar */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--signal)]/20 blur-[100px] rounded-full pointer-events-none" />
            
            <h2 className="text-xl font-black text-white relative z-10">Resumo e aceite</h2>
            
            <div className="mt-6 space-y-4 border-y border-white/10 py-6 text-sm relative z-10">
              {content.scopeItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <span className="text-gray-400 leading-tight">{item.label}</span>
                  <strong className="text-white shrink-0">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price)}</strong>
                </div>
              ))}
              {selectedAddons.map((id) => { 
                const a = content.addons.find((x) => x.id === id)!; 
                return (
                  <div key={id} className="flex justify-between items-start gap-4">
                    <span className="text-orange-400 leading-tight">+ {a.label}</span>
                    <strong className="text-white shrink-0">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(a.price)}</strong>
                  </div>
                ); 
              })}
            </div>

            <div className="relative z-10">
              {content.paymentConditions.length > 0 && (
                <label className="mt-6 block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Condição de pagamento
                  <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white font-bold outline-none focus:border-[var(--signal)] transition-colors cursor-pointer appearance-none">
                    {content.paymentConditions.map((p) => <option key={p.id} value={p.id} className="bg-black text-white">{p.label}</option>)}
                  </select>
                </label>
              )}

              <div className="mt-8 flex items-end justify-between bg-white/5 rounded-2xl p-5 border border-white/10">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Investimento Final</p>
                  <p className="money-value mt-1 text-4xl font-black tracking-tighter text-white">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}</p>
                </div>
                {selectedPayment && selectedPayment.installments > 1 && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedPayment.installments} parcelas de</p>
                    <p className="money-value text-lg font-black text-orange-400">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total / selectedPayment.installments)}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[var(--signal)] transition-colors" />
                <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF/CNPJ (opcional)" className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[var(--signal)] transition-colors" />
                
                <label className="flex items-start gap-3 text-xs leading-5 text-gray-400 mt-4 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <div className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors ${declaration ? "bg-[var(--signal)] border-[var(--signal)] text-white" : "border-white/20"}`}>
                    {declaration && <Check className="size-3.5" />}
                  </div>
                  <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="sr-only" />
                  Declaro que li e aceito os termos, escopo e condições desta proposta comercial.
                </label>
              </div>

              {error && <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400">{error}</p>}

              <button onClick={handleAccept} disabled={pending || !declaration || !name} className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--signal)] hover:bg-orange-600 p-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/20 transition-all disabled:opacity-50 disabled:shadow-none">
                Aceitar proposta <ChevronRight className="size-5" />
              </button>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={handleAlternative} disabled={pending} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors">Solicitar outra condição</button>
                <button onClick={handleReject} disabled={pending} className="rounded-xl border border-white/5 p-3 text-xs font-bold text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">Recusar proposta</button>
              </div>

              <div className="mt-8 space-y-3 text-xs font-medium text-gray-500">
                <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-500" />Aceite digital com identificação.</p>
                <p className="flex items-center gap-2"><FileText className="size-4 text-emerald-500" />Registro de data, hora e IP da transação.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
