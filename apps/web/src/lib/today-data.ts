import { db, schema } from "@pulso/database";
import { and, eq, lt, lte, ne, sql, desc } from "drizzle-orm";
import { getFinancialSummary } from "@/app/(crm)/app/financeiro/actions";
import { listProjects } from "@/app/(crm)/app/operacao/projetos/actions";

export type AttentionItem = {
  type: string;
  title: string;
  detail: string;
  urgency: "alta" | "média";
  date: Date;
  href: string;
};

export async function getTodayData() {
  const now = new Date();
  
  // America/Fortaleza offset is typically UTC-3. We want to get the start of the current day in that tz.
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(now);
  const tzDateStr = `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}-${parts.find(p=>p.type==='day')?.value}`;

  const [
    openOpportunities, 
    projects, 
    financialSummary, 
    overdueTasks, 
    overdueApprovals, 
    overdueEntries, 
    staleOpportunities,
    newTickets,
    unreadNotificationsCount
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${schema.opportunities.expectedValue}),0)::float` })
      .from(schema.opportunities).where(eq(schema.opportunities.status, "open")).then((r) => r[0]),
    listProjects(),
    getFinancialSummary("company"),
    db.select().from(schema.tasks).where(and(lte(schema.tasks.dueAt, now), ne(schema.tasks.status, "done"))).limit(3),
    db.select({ approval: schema.approvals, projectName: schema.projects.name })
      .from(schema.approvals).innerJoin(schema.projects, eq(schema.projects.id, schema.approvals.projectId))
      .where(and(eq(schema.approvals.status, "pending"), lte(schema.approvals.dueAt, now))).limit(3),
    db.select().from(schema.financialEntries)
      .where(and(eq(schema.financialEntries.scope, "company"), ne(schema.financialEntries.status, "paid"), ne(schema.financialEntries.status, "cancelled"), lt(schema.financialEntries.dueDate, tzDateStr)))
      .limit(3),
    db.select().from(schema.opportunities).where(and(eq(schema.opportunities.status, "open"), lte(schema.opportunities.nextActionAt, now))).limit(3),
    db.select().from(schema.tickets).where(eq(schema.tickets.status, "new")).limit(3),
    db.select({ count: sql<number>`count(*)` }).from(schema.adminNotifications).where(eq(schema.adminNotifications.isRead, false)).then(r => Number(r[0]?.count ?? 0))
  ]);

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "waiting");

  let attentionItems: AttentionItem[] = [
    ...overdueTasks.map((t): AttentionItem => ({ type: "Tarefa", title: t.title, detail: "Prazo vencido ou para hoje", urgency: "alta", date: new Date(t.dueAt!), href: "/app/operacao/tarefas" })),
    ...overdueApprovals.map(({ approval, projectName }): AttentionItem => ({ type: "Aprovação", title: `${approval.title} — ${projectName}`, detail: "Aguardando decisão", urgency: "alta", date: new Date(approval.dueAt!), href: `/app/operacao/projetos/${approval.projectId}` })),
    ...overdueEntries.map((e): AttentionItem => ({ type: "Financeiro", title: `${e.code} — ${e.description}`, detail: `Vencido em ${new Date(e.dueDate!).toLocaleDateString("pt-BR")}`, urgency: "alta", date: new Date(e.dueDate!), href: e.direction === "in" ? "/app/financeiro/receber" : "/app/financeiro/pagar" })),
    ...staleOpportunities.map((o): AttentionItem => ({ type: "Oportunidade", title: o.title, detail: "Próxima ação vencida ou para hoje", urgency: "média", date: new Date(o.nextActionAt!), href: `/app/comercial/oportunidades/${o.id}` })),
    ...newTickets.map((t): AttentionItem => ({ type: "Chamado", title: t.title, detail: "Chamado novo e não respondido", urgency: "alta", date: new Date(t.createdAt!), href: `/app/operacao/suporte/${t.id}` }))
  ];

  attentionItems = attentionItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    now,
    tzDateStr,
    openOpportunities,
    activeProjects,
    projects,
    financialSummary,
    attentionItems,
    unreadNotificationsCount,
    overdueTasks,
    overdueApprovals,
    overdueEntries,
    staleOpportunities,
    newTickets
  };
}

export function formatTodayDataForTelegram(data: Awaited<ReturnType<typeof getTodayData>>): string {
  const parts: string[] = [];

  parts.push(`*Central de Hoje* 📅 ${data.now.toLocaleDateString("pt-BR")}`);
  parts.push("");

  // Métricas
  parts.push(`*Métricas principais:*`);
  parts.push(`• Projetos ativos: ${data.activeProjects.length}`);
  parts.push(`• Oportunidades em aberto: ${data.openOpportunities.count}`);
  parts.push(`• A receber pendente: ${data.financialSummary.overdueCount} vencidos`);
  
  if (data.unreadNotificationsCount > 0) {
    parts.push(`• *Notificações não lidas: ${data.unreadNotificationsCount}* 🔔`);
  }
  parts.push("");

  // Tarefas
  if (data.overdueTasks.length > 0) {
    parts.push(`*Tarefas vencidas/hoje (${data.overdueTasks.length})*`);
    data.overdueTasks.slice(0, 3).forEach(t => parts.push(`• ${t.title.slice(0, 50)}`));
    if (data.overdueTasks.length > 3) parts.push(`_E mais ${data.overdueTasks.length - 3}..._`);
    parts.push("");
  }

  // Aprovações
  if (data.overdueApprovals.length > 0) {
    parts.push(`*Aprovações pendentes/vencidas (${data.overdueApprovals.length})*`);
    data.overdueApprovals.slice(0, 3).forEach(a => parts.push(`• ${a.approval.title.slice(0, 50)}`));
    if (data.overdueApprovals.length > 3) parts.push(`_E mais ${data.overdueApprovals.length - 3}..._`);
    parts.push("");
  }

  // Chamados
  if (data.newTickets.length > 0) {
    parts.push(`*Novos chamados (${data.newTickets.length})* 🚨`);
    data.newTickets.slice(0, 3).forEach(t => parts.push(`• [${t.code}] ${t.title.slice(0, 40)}`));
    if (data.newTickets.length > 3) parts.push(`_E mais ${data.newTickets.length - 3}..._`);
    parts.push("");
  }

  // Oportunidades
  if (data.staleOpportunities.length > 0) {
    parts.push(`*Oportunidades precisando de ação (${data.staleOpportunities.length})*`);
    data.staleOpportunities.slice(0, 3).forEach(o => parts.push(`• ${o.title.slice(0, 50)}`));
    if (data.staleOpportunities.length > 3) parts.push(`_E mais ${data.staleOpportunities.length - 3}..._`);
    parts.push("");
  }

  if (parts.length === 6) {
    parts.push("Tudo tranquilo por aqui! Nenhum item pendente precisando da sua atenção.");
  }

  // Escape markdown characters safely for Telegram MarkdownV2 if needed, 
  // but it's better to escape at the sending point or carefully construct.
  // Actually, replacing markdown characters for MarkdownV2 is tricky. 
  // We will assume the caller will escape it or we just format cleanly.
  return parts.join("\n").slice(0, 4000);
}
