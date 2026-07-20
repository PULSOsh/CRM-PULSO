import Link from "next/link";
import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { ArrowRight, CalendarClock, CheckCircle2, CircleDollarSign, FileText, Plus, UserPlus } from "lucide-react";
import { and, eq, lt, ne, sql } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { ProjectCards } from "@/components/project-cards";
import { getFinancialSummary } from "../financeiro/actions";
import { listProjects } from "../operacao/projetos/actions";

const shortcuts = [
  { label: "Novo lead", icon: UserPlus, href: "/app/comercial/leads/novo" },
  { label: "Nova tarefa", icon: CalendarClock, href: "/app/operacao/tarefas" },
  { label: "Nova proposta", icon: FileText, href: "/app/comercial/propostas/novo" },
  { label: "Nova despesa", icon: CircleDollarSign, href: "/app/financeiro/pagar" }
];

type AttentionItem = { type: string; title: string; detail: string; urgency: "alta" | "média"; date: Date; href: string };

export default async function TodayPage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [openOpportunities, projects, financialSummary, overdueTasks, overdueApprovals, overdueEntries, staleOpportunities] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${schema.opportunities.expectedValue}),0)::float` })
      .from(schema.opportunities).where(eq(schema.opportunities.status, "open")).then((r) => r[0]),
    listProjects(),
    getFinancialSummary("company"),
    db.select().from(schema.tasks).where(and(lt(schema.tasks.dueAt, now), ne(schema.tasks.status, "done"))).limit(3),
    db.select({ approval: schema.approvals, projectName: schema.projects.name })
      .from(schema.approvals).innerJoin(schema.projects, eq(schema.projects.id, schema.approvals.projectId))
      .where(and(eq(schema.approvals.status, "pending"), lt(schema.approvals.dueAt, now))).limit(3),
    db.select().from(schema.financialEntries)
      .where(and(eq(schema.financialEntries.scope, "company"), ne(schema.financialEntries.status, "paid"), ne(schema.financialEntries.status, "cancelled"), lt(schema.financialEntries.dueDate, today)))
      .limit(3),
    db.select().from(schema.opportunities).where(and(eq(schema.opportunities.status, "open"), lt(schema.opportunities.nextActionAt, now))).limit(3)
  ]);

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "waiting");

  const attentionItems: AttentionItem[] = [
    ...overdueTasks.map((t): AttentionItem => ({ type: "Tarefa", title: t.title, detail: "Prazo vencido", urgency: "alta", date: new Date(t.dueAt!), href: "/app/operacao/tarefas" })),
    ...overdueApprovals.map(({ approval, projectName }): AttentionItem => ({ type: "Aprovação", title: `${approval.title} — ${projectName}`, detail: "Aguardando decisão do cliente, prazo vencido", urgency: "alta", date: new Date(approval.dueAt!), href: `/app/operacao/projetos/${approval.projectId}` })),
    ...overdueEntries.map((e): AttentionItem => ({ type: "Financeiro", title: `${e.code} — ${e.description}`, detail: `Vencido em ${new Date(e.dueDate!).toLocaleDateString("pt-BR")}`, urgency: "alta", date: new Date(e.dueDate!), href: e.direction === "in" ? "/app/financeiro/receber" : "/app/financeiro/pagar" })),
    ...staleOpportunities.map((o): AttentionItem => ({ type: "Oportunidade", title: o.title, detail: "Próxima ação vencida", urgency: "média", date: new Date(o.nextActionAt!), href: `/app/comercial/oportunidades/${o.id}` }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);

  const metrics = [
    { label: "Pipeline aberto", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(openOpportunities.total), trend: `${openOpportunities.count} oportunidades` },
    { label: "Projetos ativos", value: String(activeProjects.length), trend: `${projects.length} no total` },
    { label: "A receber pendente", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.receivablePending), trend: `${financialSummary.overdueCount} vencidos` },
    { label: "Itens vencidos", value: String(attentionItems.length), trend: "tarefas, aprovações e financeiro" }
  ];

  const todayLabel = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader eyebrow={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} title="Central de hoje" description="O que precisa da sua atenção agora, sem ruído."
        actions={<Link href="/app/comercial/leads/novo" className="primary-button"><Plus className="size-4" />Criar</Link>} />
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
          {attentionItems.map((item) => (
            <Link key={`${item.type}-${item.title}`} href={item.href} className="flex items-start gap-4 border-b border-[var(--line)] p-5 last:border-0 hover:bg-[var(--soft)]">
              <div className={`mt-1 size-2.5 shrink-0 rounded-full ${item.urgency === "alta" ? "bg-[var(--signal)]" : "bg-[var(--warning)]"}`} />
              <div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">{item.type}</p><h3 className="mt-1 font-extrabold">{item.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p></div>
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)]"><ArrowRight className="size-4" /></div>
            </Link>
          ))}
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
