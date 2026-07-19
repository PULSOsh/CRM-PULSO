import Link from "next/link";
import { attentionItems, demoMetrics } from "@pulso/database/demo";
import { Badge, Card } from "@pulso/ui";
import { ArrowRight, CalendarClock, CheckCircle2, CircleDollarSign, FileText, Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProjectBoard } from "@/components/project-board";

const shortcuts = [
  { label: "Novo lead", icon: UserPlus },
  { label: "Nova tarefa", icon: CalendarClock },
  { label: "Nova proposta", icon: FileText },
  { label: "Nova despesa", icon: CircleDollarSign }
];

export default function TodayPage() {
  return (
    <>
      <PageHeader eyebrow="Domingo, 19 de julho" title="Central de hoje" description="O que precisa da sua atenção agora, sem ruído."
        actions={<button className="primary-button"><Plus className="size-4" />Criar</button>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {demoMetrics.map(metric => (
          <Card key={metric.label} className="p-5">
            <p className="text-xs font-bold text-[var(--muted)]">{metric.label}</p>
            <p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{metric.value}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">{metric.trend}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <div><h2 className="font-extrabold">Precisa de atenção</h2><p className="mt-1 text-xs text-[var(--muted)]">Ordenado por impacto e prazo.</p></div>
            <Badge tone="signal">{attentionItems.length} itens</Badge>
          </div>
          {attentionItems.map(item => (
            <div key={item.title} className="flex items-start gap-4 border-b border-[var(--line)] p-5 last:border-0">
              <div className={`mt-1 size-2.5 shrink-0 rounded-full ${item.urgency === "alta" ? "bg-[var(--signal)]" : "bg-amber-500"}`} />
              <div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">{item.type}</p><h3 className="mt-1 font-extrabold">{item.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p></div>
              <button className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] hover:bg-[var(--soft)]"><ArrowRight className="size-4" /></button>
            </div>
          ))}
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="font-extrabold">Ações rápidas</h2><div className="mt-4 grid grid-cols-2 gap-2">
            {shortcuts.map(s => { const Icon=s.icon; return <button key={s.label} className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 text-left hover:border-[var(--signal)]"><Icon className="size-5 text-[var(--signal)]" /><span className="text-sm font-extrabold">{s.label}</span></button>; })}
          </div></Card>
          <Card className="bg-[var(--carbon)] p-5 text-[var(--paper)]"><div className="flex items-start gap-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--signal)]"><CheckCircle2 className="size-5 text-white" /></div>
            <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--neutral)]">Configuração</p><h2 className="mt-2 font-extrabold">O CRM funciona sem integrações</h2><p className="mt-2 text-sm leading-6 text-[var(--neutral)]">ZapSign, AbacatePay, IA, Telegram e Google Calendar podem ser configurados depois.</p><Link href="/app/configuracoes/integracoes" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-white">Revisar integrações <ArrowRight className="size-4" /></Link></div>
          </div></Card>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--signal)]">Operação</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Projetos em andamento</h2></div><Link href="/app/operacao/projetos" className="text-sm font-extrabold">Ver todos</Link></div>
      <div className="mt-4"><ProjectBoard /></div>
    </>
  );
}
