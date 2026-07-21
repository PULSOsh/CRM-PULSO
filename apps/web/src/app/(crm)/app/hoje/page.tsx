import Link from "next/link";
import { Badge, Card } from "@pulso/ui";
import { ArrowRight, CalendarClock, CheckCircle2, CircleDollarSign, FileText, Plus, UserPlus, Briefcase, Wallet, AlertCircle, PieChart } from "lucide-react";
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
    { label: "Pipeline aberto", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(openOpportunities.total), trend: `${openOpportunities.count} oportunidades`, icon: PieChart },
    { label: "Projetos ativos", value: String(activeProjects.length), trend: `${projects.length} no total`, icon: Briefcase },
    { label: "A receber pendente", value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.receivablePending), trend: `${financialSummary.overdueCount} vencidos`, icon: Wallet },
    { label: "Itens vencidos", value: String(attentionItems.length), trend: "tarefas, aprovações, suporte e financeiro", icon: AlertCircle }
  ];

  const todayLabel = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader eyebrow={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} title="Central de hoje" description="O que precisa da sua atenção agora, sem ruído."
        actions={<Link href="/app/comercial/leads/novo" className="primary-button"><Plus className="size-4" />Criar</Link>} />
      
      {unreadNotificationsCount > 0 && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 backdrop-blur-sm relative overflow-hidden group hover:border-destructive/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/5 to-destructive/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="relative flex items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-white font-extrabold shadow-lg shadow-destructive/20">{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</span>
            <div className="flex-1">
              <p className="font-extrabold text-destructive">Notificações administrativas não lidas</p>
              <p className="text-sm text-destructive/80 mt-0.5">Há eventos importantes que exigem sua atenção na Central de Notificações.</p>
            </div>
            <Link href="/app/inteligencia/notificacoes" className="secondary-button !border-destructive/30 !text-destructive hover:!bg-destructive/10">
              Ver notificações
            </Link>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="relative overflow-hidden p-6 border border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[var(--signal)]/50 hover:shadow-lg hover:shadow-[var(--signal)]/5">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon className="size-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--soft)] text-[var(--signal)]">
                    <Icon className="size-4" />
                  </div>
                  <p className="text-xs font-bold text-[var(--muted)]">{metric.label}</p>
                </div>
                <p className="money-value text-3xl font-black tracking-[-0.06em] text-[var(--text)]">{metric.value}</p>
                <p className="mt-2 text-xs font-medium text-[var(--muted)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] opacity-50"></span>
                  {metric.trend}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden border border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl shadow-2xl shadow-black/5">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--soft)]/50 px-6 py-5">
            <div>
              <h2 className="font-extrabold flex items-center gap-2 text-lg">
                <AlertCircle className="size-5 text-[var(--warning)]" />
                Precisa de atenção
              </h2>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">Ordenado por urgência e prazo.</p>
            </div>
            <Badge tone="signal" className="px-3 py-1 text-sm shadow-sm">{attentionItems.length} itens</Badge>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {attentionItems.length === 0 && <p className="p-10 text-center text-sm font-medium text-[var(--muted)]">Tudo em dia! Nada vencido no momento.</p>}
            {attentionItems.slice(0, 6).map((item) => (
              <Link key={`${item.type}-${item.title}`} href={item.href} className="group flex items-start gap-4 p-5 transition-colors hover:bg-[var(--soft)]/80">
                <div className={`mt-1.5 size-3 shrink-0 rounded-full shadow-sm ${item.urgency === "alta" ? "bg-[var(--signal)] shadow-[var(--signal)]/30" : "bg-[var(--warning)] shadow-[var(--warning)]/30"}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)] group-hover:text-[var(--text)] transition-colors">{item.type}</p>
                  <h3 className="mt-1 font-extrabold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] group-hover:border-[var(--signal)]/50 group-hover:bg-[var(--signal)] group-hover:text-white transition-all shadow-sm">
                  <ArrowRight className="size-4" />
                </div>
              </Link>
            ))}
          </div>
          {attentionItems.length > 6 && (
            <div className="bg-[var(--soft)]/30 p-4 text-center border-t border-[var(--line)] text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer">
              E mais {attentionItems.length - 6} item(s) aguardando.
            </div>
          )}
        </Card>
        
        <div className="space-y-8">
          <Card className="p-6 border border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl shadow-2xl shadow-black/5">
            <h2 className="font-extrabold text-lg mb-5">Ações rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((s) => { 
                const Icon = s.icon; 
                return (
                  <Link key={s.label} href={s.href} className="group flex min-h-[100px] flex-col items-start justify-between rounded-2xl border border-[var(--line)] bg-[var(--soft)]/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--signal)] hover:bg-[var(--signal)]/5 hover:shadow-lg hover:shadow-[var(--signal)]/10">
                    <div className="rounded-lg bg-[var(--surface)] p-2 shadow-sm border border-[var(--line)] group-hover:border-[var(--signal)]/30 group-hover:bg-[var(--signal)]/10">
                      <Icon className="size-5 text-[var(--signal)]" />
                    </div>
                    <span className="text-sm font-extrabold mt-3">{s.label}</span>
                  </Link>
                ); 
              })}
            </div>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-[var(--carbon)] to-[#1a1a1a] p-6 text-[var(--paper)] shadow-2xl border border-white/10">
            <div className="absolute -top-12 -right-12 size-40 bg-[var(--signal)]/20 blur-3xl rounded-full"></div>
            <div className="flex items-start gap-5 relative z-10">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--signal)] to-orange-600 shadow-lg shadow-[var(--signal)]/20">
                <CheckCircle2 className="size-6 text-white" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--neutral)]">Configuração</p>
                <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-white">O CRM funciona sem integrações</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--neutral)] opacity-80">ZapSign, AbacatePay, IA, Telegram e Calendar podem ser configurados depois.</p>
                <Link href="/app/configuracoes/integracoes" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-white hover:text-[var(--signal)] transition-colors">
                  Revisar integrações <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="mt-12 mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-[var(--signal)] animate-pulse"></span>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--signal)]">Operação</p>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Projetos em andamento</h2>
        </div>
        <Link href="/app/operacao/projetos" className="secondary-button hover:bg-[var(--signal)]/10 hover:text-[var(--signal)] hover:border-[var(--signal)]/30">
          Ver todos
        </Link>
      </div>
      
      <div className="mt-4">
        {activeProjects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center min-h-[200px] border-dashed border-2 border-[var(--line)] bg-[var(--surface)]/30">
            <Briefcase className="size-10 text-[var(--muted)] mb-4 opacity-50" />
            <p className="text-sm font-medium text-[var(--muted)]">Nenhum projeto ativo no momento.</p>
          </Card>
        ) : (
          <ProjectCards projects={activeProjects} />
        )}
      </div>
    </>
  );
}
