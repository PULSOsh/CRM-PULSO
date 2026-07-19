"use client";
import { useState } from "react";
import { Check, ChevronRight, Cloud, Paperclip } from "lucide-react";

export default function BriefingPage() {
  const [progress, setProgress] = useState(42);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">BRF-2026-0014 · Site institucional</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">Vamos entender seu projeto.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">Suas respostas ficam salvas automaticamente e podem ser retomadas depois.</p>
      </div>
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs font-bold"><span>Progresso do briefing</span><span>{progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--soft)]"><div className="h-full bg-[var(--signal)] transition-all" style={{width:`${progress}%`}} /></div>
      </div>
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm md:p-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Etapa 2 de 5 · Objetivos</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">O que este projeto precisa resolver?</h2>
        <div className="mt-7 space-y-6">
          <label className="block"><span className="mb-2 block text-sm font-bold">Descreva o principal objetivo</span><textarea className="min-h-36 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--signal)]" defaultValue="Queremos apresentar a clínica de forma profissional e aumentar os pedidos de agendamento pelo WhatsApp." /></label>
          <fieldset><legend className="mb-3 text-sm font-bold">Quais resultados são importantes?</legend>
            <div className="grid gap-2 sm:grid-cols-2">{["Gerar contatos","Apresentar serviços","Transmitir confiança","Facilitar agendamentos"].map((item,index)=><label key={item} className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-4 font-semibold"><span className={`grid size-5 place-items-center rounded-md border ${index<3?"border-[var(--signal)] bg-[var(--signal)] text-white":"border-[var(--line)]"}`}>{index<3&&<Check className="size-3" />}</span>{item}</label>)}</div>
          </fieldset>
          <label className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--neutral)] bg-[var(--soft)] p-4"><Paperclip className="size-5 text-[var(--signal)]" /><span><strong className="block text-sm">Anexar referências</strong><span className="text-xs text-[var(--muted)]">PDF, PNG, JPG ou DOCX — até 25 MB</span></span></label>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-[var(--line)] pt-5"><span className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]"><Cloud className="size-4" />Salvo agora</span><button onClick={()=>setProgress(64)} className="primary-button">Continuar <ChevronRight className="size-4" /></button></div>
      </div>
    </main>
  );
}
