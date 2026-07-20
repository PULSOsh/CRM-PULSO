import Link from "next/link";
import { Badge, Card } from "@pulso/ui";
import { ArrowRight, CalendarClock, CheckCircle2, CircleDollarSign, FileText, Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProjectCards } from "@/components/project-cards";
import { getTodayData } from "@/lib/today-data";

const shortcuts = [
  { label: "Novo lead", icon: UserPlus, href: "/app/comercial/leads/novo" },
  { label: "Nova tarefa", icon: CalendarClock, href: "/app/operacao/tarefas" },
  { label: "Nova proposta", icon: FileText, href: "/app/comercial/propostas/novo" },
  { label: "Nova despesa", icon: CircleDollarSign, href: "/app/financeiro/pagar" }
];

export default async function TodayPage() {
  const { now, openOpportunities, activeProjects, projects, financialSummary, attentionItems, unreadNotificationsCount } = await getTodayData();

  const metrics = [
    { label: "Pipeline aberto", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(openOpportunities.total), trend: `${openOpportunities.count} oportunidades` },
    { label: "Projetos ativos", value: String(activeProjects.length), trend: `${projects.length} no total` },
    { label: "A receber pendente", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.receivablePending), trend: `${financialSummary.overdueCount} vencidos` },
    { label: "Itens vencidos", value: String(attentionItems.length), trend: "tarefas, aprovações, suporte e financeiro" }
  ];

  const todayLabel = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader eyebrow={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} title="Central de hoje" description="O que precisa da sua atenção agora, sem ruído."
        actions={<Link href="/app/comercial/leads/novo" className="primary-button"><Plus className="size-4" />Criar</Link>} />
      
      {unreadNotificationsCount > 0 && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive text-white font-bold text-xs">{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</span>
            <div className="flex-1">
              <p className="font-semibold text-destructive">Notificações administrativas não lidas</p>
              <p className="text-destructive/80">Há eventos importantes que exigem sua atenção na Central de Notificações.</p>
            </div>
            <Link href="/app/inteligencia/notificacoes" className="font-semibold text-destructive underline">
              Ver notificações
            </Link>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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
            <div><h2 className="font-extrabold">Precisa de atenção</h2><p className="mt-1 text-xs text-[var(--muted)]">Ordenado por prazo.</p></div>
            <Badge tone="signal">{attentionItems.length} itens</Badge>
          </div>
          {attentionItems.length === 0 && <p className="p-5 text-sm text-[var(--muted)]">Nada vencido no momento.</p>}
          {attentionItems.slice(0, 6).map((item) => (
            <Link key={`${item.type}-${item.title}`} href={item.href} className="flex items-start gap-4 border-b border-[var(--line)] p-5 last:border-0 hover:bg-[var(--soft)]">
              <div className={`mt-1 size-2.5 shrink-0 rounded-full ${item.urgency === "alta" ? "bg-[var(--signal)]" : "bg-[var(--warning)]"}`} />
              <div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">{item.type}</p><h3 className="mt-1 font-extrabold">{item.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p></div>
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)]"><ArrowRight className="size-4" /></div>
            </Link>
          ))}
          {attentionItems.length > 6 && (
            <div className="p-4 text-center border-t border-[var(--line)] text-sm text-[var(--muted)]">
              E mais {attentionItems.length - 6} item(s) aguardando.
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card className="p-5"><h2 className="font-extrabold">Ações rápidas</h2><div className="mt-4 grid grid-cols-2 gap-2">
            {shortcuts.map((s) => { const Icon = s.icon; return (
              <Link key={s.label} href={s.href} className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 text-left hover:border-[var(--signal)]">
                <Icon className="size-5 text-[var(--signal)]" /><span className="text-sm font-extrabold">{s.label}</span>
              </Link>
            ); })}
          </div></Card>
          <Card className="bg-[var(--carbon)] p-5 text-[var(--paper)]"><div className="flex items-start gap-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--signal)]"><CheckCircle2 className="size-5 text-white" /></div>
            <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--neutral)]">Configuração</p><h2 className="mt-2 font-extrabold">O CRM funciona sem integrações</h2><p className="mt-2 text-sm leading-6 text-[var(--neutral)]">ZapSign, AbacatePay, IA, Telegram e Google Calendar podem ser configurados depois.</p><Link href="/app/configuracoes/integracoes" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-white">Revisar integrações <ArrowRight className="size-4" /></Link></div>
          </div></Card>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--signal)]">Operação</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Projetos em andamento</h2></div><Link href="/app/operacao/projetos" className="text-sm font-extrabold">Ver todos</Link></div>
      <div className="mt-4">
        {activeProjects.length === 0 ? <Card className="p-8 text-center text-sm text-[var(--muted)]">Nenhum projeto ativo no momento.</Card> : <ProjectCards projects={activeProjects} />}
      </div>
    </>
  );
}
