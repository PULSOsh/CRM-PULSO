"use client";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Clock3, FileText, ShieldCheck, Sparkles } from "lucide-react";

const addons = [
  {name:"Otimização SEO inicial",price:450},
  {name:"Integração com agenda",price:600},
  {name:"Treinamento gravado",price:250}
];

export default function ProposalPage() {
  const [selected,setSelected]=useState<number[]>([0]);
  const [installments,setInstallments]=useState(3);
  const total=useMemo(()=>2500+selected.reduce((sum,index)=>sum+addons[index].price,0),[selected]);
  return (
    <main>
      <section className="bg-[var(--carbon)] px-4 py-16 text-[var(--paper)] md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">PROP-2026-0014 · Versão 2</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div><p className="text-sm text-[var(--neutral)]">Proposta para Clínica Horizonte</p><h1 className="mt-3 max-w-3xl text-5xl font-black tracking-[-0.065em] md:text-7xl">Um site que transforma confiança em agendamentos.</h1></div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5"><p className="text-xs font-bold text-[var(--neutral)]">Investimento a partir de</p><p className="money-value mt-2 text-4xl font-black">R$ 2.500</p><p className="mt-3 flex items-center gap-2 text-xs text-[var(--neutral)]"><Clock3 className="size-4" />Válida até 31/07/2026</p></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14"><div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <article><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--signal)]">Contexto entendido</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">A clínica precisa explicar seu valor antes do primeiro contato.</h2><p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">O projeto será construído para apresentar especialidades, equipe, estrutura e diferenciais com uma jornada simples até o WhatsApp.</p></article>
          <article><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--signal)]">Escopo</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">O que está incluído</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{["Arquitetura da informação","Design responsivo","Desenvolvimento","Formulário e WhatsApp","Otimização técnica","Publicação e treinamento"].map(item=><div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 font-bold"><span className="grid size-6 place-items-center rounded-full bg-[var(--signal)] text-white"><Check className="size-3.5" /></span>{item}</div>)}</div></article>
          <article><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--signal)]">Adicionais</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">Personalize a solução</h2><div className="mt-6 space-y-3">
            {addons.map((addon,index)=>{const active=selected.includes(index);return <button key={addon.name} onClick={()=>setSelected(v=>active?v.filter(i=>i!==index):[...v,index])} className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left ${active?"border-[var(--signal)] bg-[color:var(--signal)/.06]":"border-[var(--line)] bg-[var(--surface)]"}`}><span className={`grid size-6 place-items-center rounded-md border ${active?"border-[var(--signal)] bg-[var(--signal)] text-white":"border-[var(--line)]"}`}>{active&&<Check className="size-3.5" />}</span><span className="flex-1 font-bold">{addon.name}</span><span className="money-value font-black">+ R$ {addon.price}</span></button>})}
          </div></article>
        </div>
        <aside className="h-fit rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center gap-3"><Sparkles className="size-5 text-[var(--signal)]" /><h2 className="text-lg font-extrabold">Resumo da proposta</h2></div>
          <div className="mt-5 space-y-3 border-y border-[var(--line)] py-5 text-sm"><div className="flex justify-between"><span className="text-[var(--muted)]">Site institucional</span><strong>R$ 2.500</strong></div>{selected.map(index=><div key={index} className="flex justify-between"><span className="text-[var(--muted)]">{addons[index].name}</span><strong>R$ {addons[index].price}</strong></div>)}</div>
          <label className="mt-5 block text-xs font-bold text-[var(--muted)]">Condição de pagamento<select value={installments} onChange={e=>setInstallments(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 font-bold"><option value={1}>À vista</option><option value={2}>2 parcelas</option><option value={3}>3 parcelas</option><option value={4}>4 parcelas</option></select></label>
          <div className="mt-6 flex items-end justify-between"><div><p className="text-xs text-[var(--muted)]">Total selecionado</p><p className="money-value mt-1 text-3xl font-black tracking-[-.05em]">R$ {total.toLocaleString("pt-BR")}</p></div><p className="money-value text-xs font-bold text-[var(--muted)]">{installments}x de R$ {(total/installments).toLocaleString("pt-BR",{maximumFractionDigits:2})}</p></div>
          <button className="primary-button mt-5 w-full">Aceitar proposta <ChevronRight className="size-4" /></button><button className="secondary-button mt-2 w-full">Solicitar outra condição</button>
          <div className="mt-5 space-y-2 text-xs text-[var(--muted)]"><p className="flex items-center gap-2"><ShieldCheck className="size-4" />Aceite com identificação e evidências.</p><p className="flex items-center gap-2"><FileText className="size-4" />PDF complementar disponível.</p></div>
        </aside>
      </div></section>
    </main>
  );
}
