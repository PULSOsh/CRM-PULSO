import Link from "next/link";
import { Download, Landmark, TimerReset, TrendingUp } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { REPORT_PERIOD, type ReportPeriod } from "@/lib/reports/constants";
import {
  getCommercialReport,
  getFinancialReport,
  getOperationsReport,
  type ReportSourceCount,
  type ReportStatusCount
} from "@/lib/reports/queries";
import { getReportPeriodOrDefault } from "@/lib/reports/period";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const PERIOD_OPTIONS: ReadonlyArray<{ value: ReportPeriod; label: string }> = [
  { value: REPORT_PERIOD.THIRTY_DAYS, label: "30 dias" },
  { value: REPORT_PERIOD.NINETY_DAYS, label: "90 dias" },
  { value: REPORT_PERIOD.YEAR, label: "Ano atual" },
  { value: REPORT_PERIOD.ALL, label: "Todo o período" }
];

const STATUS_LABELS: Readonly<Record<string, string>> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  disqualified: "Desqualificado",
  open: "Aberta",
  won: "Ganha",
  lost: "Perdida",
  planned: "Planejado",
  in_progress: "Em andamento",
  completed: "Concluído",
  on_hold: "Em espera",
  pending: "Pendente",
  approved: "Aprovada",
  changes_requested: "Alterações solicitadas",
  resolved: "Resolvido",
  closed: "Encerrado",
  waiting_customer: "Aguardando cliente"
};

function currency(value: number): string {
  return currencyFormatter.format(value);
}

function percentage(value: number | null): string {
  return value === null ? "Sem dados" : `${(value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function duration(value: number | null): string {
  if (value === null) {
    return "Sem dados";
  }

  const roundedMinutes = Math.round(value);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
}

function labelFromValue(value: string | null): string {
  if (!value) {
    return "Não informado";
  }

  return STATUS_LABELS[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ExportLink({ report, period, label }: { report: "commercial" | "operations" | "financial"; period: ReportPeriod; label: string }) {
  return (
    <a
      href={`/api/reports/export?report=${report}&period=${period}`}
      className="secondary-button inline-flex min-h-11 items-center gap-2 px-4"
      aria-label={`Exportar relatório ${label.toLowerCase()} em CSV`}
    >
      <Download className="size-4" aria-hidden="true" />
      Exportar CSV
    </a>
  );
}

function MetricCard({
  label,
  value,
  description,
  money = false
}: {
  label: string;
  value: string;
  description: string;
  money?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden p-6 border border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[var(--signal)]/50 hover:shadow-lg hover:shadow-[var(--signal)]/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--signal)]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      <div className="relative z-10">
        <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{label}</p>
        <p className={`${money ? "money-value " : ""}mt-3 break-words text-3xl font-black tabular-nums tracking-[-0.06em] text-[var(--text)]`}>{value}</p>
        <p className="mt-3 flex items-start gap-2 text-xs font-medium leading-relaxed text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)]/60 mt-1 shrink-0"></span>
          {description}
        </p>
      </div>
    </Card>
  );
}

function DistributionList({ title, items, source = false }: { title: string; items: readonly ReportStatusCount[] | readonly ReportSourceCount[]; source?: boolean }) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <Card className="p-6 border border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-md">
      <h3 className="font-extrabold text-lg flex items-center gap-2">
        <div className="w-1 h-5 bg-[var(--signal)] rounded-full"></div>
        {title}
      </h3>
      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center p-6 border border-dashed border-[var(--line)] rounded-xl bg-[var(--soft)]/30">
          <p className="text-sm font-medium text-[var(--muted)]">Nenhum registro no período.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-5" aria-label={title}>
          {items.map((item) => {
            const name = labelFromValue(source ? (item as ReportSourceCount).source : (item as ReportStatusCount).status);
            const percentageWidth = `${Math.max(4, (item.count / max) * 100)}%`;

            return (
              <li key={name} className="group">
                <div className="flex items-baseline justify-between gap-3 text-sm mb-2">
                  <span className="min-w-0 break-words font-semibold group-hover:text-[var(--text)] transition-colors">{name}</span>
                  <span className="shrink-0 font-mono text-xs font-bold text-[var(--muted)] group-hover:text-[var(--signal)] transition-colors">{item.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--soft)] border border-[var(--line)]" aria-hidden="true">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--signal)]/80 to-[var(--signal)] transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--signal-rgb),0.5)]" style={{ width: percentageWidth }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const params = await searchParams;
  const period = getReportPeriodOrDefault(Array.isArray(params.period) ? params.period[0] : params.period);
  const [commercial, operations, financial] = await Promise.all([
    getCommercialReport(period),
    getOperationsReport(period),
    getFinancialReport(period)
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Inteligência"
        title="Relatórios"
        description="Indicadores comerciais, operacionais e financeiros calculados a partir dos registros reais."
      />

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Período do relatório">
        {PERIOD_OPTIONS.map((option) => {
          const selected = option.value === period;

          return (
            <Link
              key={option.value}
              href={`/app/inteligencia/relatorios?period=${option.value}`}
              className={`filter-chip inline-flex min-h-11 items-center ${selected ? "filter-chip-active" : ""}`}
              aria-current={selected ? "page" : undefined}
            >
              {option.label}{selected ? " (selecionado)" : ""}
            </Link>
          );
        })}
      </nav>

      <section aria-labelledby="commercial-heading" className="mb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-[var(--signal)]" aria-hidden="true" />
            <h2 id="commercial-heading" className="text-xl font-extrabold tracking-[-0.03em]">Comercial</h2>
          </div>
          <ExportLink report="commercial" period={period} label="comercial" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pipeline aberto" value={currency(commercial.opportunities.openPipelineValue)} money description={`${commercial.opportunities.openPipelineCount} oportunidade(s) abertas; ${commercial.opportunities.createdCount} criada(s) no período — fotografia atual.`} />
          <MetricCard label="Valor ganho" value={currency(commercial.opportunities.wonValue)} money description={`${commercial.opportunities.wonCount} ganha(s) e ${commercial.opportunities.lostCount} perdida(s), fechadas por closedAt.`} />
          <MetricCard label="Conversão de leads" value={percentage(commercial.leads.conversionRate)} description="Leads convertidos entre convertidos e desqualificados por createdAt." />
          <MetricCard label="Taxa de ganho" value={percentage(commercial.opportunities.winRate)} description="Oportunidades encerradas como ganhas entre ganhas e perdidas por closedAt." />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <DistributionList title="Leads criados por status" items={commercial.leads.byStatus} />
          <DistributionList title="Leads criados por origem" items={commercial.leads.bySource} source />
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Leads e oportunidades criadas usam <code>createdAt</code>; ganhos e perdas usam <code>closedAt</code>. O pipeline aberto é uma fotografia do momento.</p>
      </section>

      <section aria-labelledby="operations-heading" className="mb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TimerReset className="size-5 text-[var(--signal)]" aria-hidden="true" />
            <h2 id="operations-heading" className="text-xl font-extrabold tracking-[-0.03em]">Operacional</h2>
          </div>
          <ExportLink report="operations" period={period} label="operacional" />
        </div>
        <Card className="mb-3 border-[var(--signal)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold">Fotografia atual</h3>
            <Badge tone="neutral">Independente do período</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DistributionList title="Projetos por status" items={operations.snapshot.projectsByStatus} />
            <MetricCard label="Aprovações pendentes" value={String(operations.snapshot.pendingApprovalsCount)} description="Pendências abertas neste instante." />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-extrabold">Movimento no período</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Aprovações aprovadas" value={String(operations.movement.approvals.approvedCount)} description="Decisões registradas por decidedAt." />
            <MetricCard label="Alterações solicitadas" value={String(operations.movement.approvals.changesRequestedCount)} description="Decisões registradas por decidedAt." />
            <MetricCard label="Horas realizadas" value={`${(operations.movement.time.registeredMinutes / 60).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`} description={`${operations.movement.time.relatedProjectsEstimatedHours.toLocaleString("pt-BR")} h estimadas nos projetos relacionados; horas por startedAt.`} />
            <MetricCard label="Chamados criados" value={String(operations.movement.tickets.createdCount)} description={`${operations.movement.tickets.resolvedCycleCount} ciclo(s) resolvido(s) no período.`} />
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <DistributionList title="Chamados criados por status" items={operations.movement.tickets.createdByStatus} />
            <MetricCard label="Média de resolução" value={duration(operations.movement.tickets.averageResolutionMinutes)} description="Mede somente ciclos com início e fim reais, resolvidos por resolvedAt." />
          </div>
        </Card>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Projetos e aprovações pendentes são fotografia atual. Aprovações usam <code>decidedAt</code>, horas usam <code>startedAt</code> e chamados usam <code>createdAt</code> e <code>resolvedAt</code>.</p>
      </section>

      <section aria-labelledby="financial-heading" className="pb-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-[var(--signal)]" aria-hidden="true" />
            <h2 id="financial-heading" className="text-xl font-extrabold tracking-[-0.03em]">Financeiro</h2>
          </div>
          <ExportLink report="financial" period={period} label="financeiro" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Previsto a receber" value={currency(financial.forecast.incomeExpected)} money description="Lançamentos empresariais por dueDate." />
          <MetricCard label="Previsto a pagar" value={currency(financial.forecast.expenseExpected)} money description="Lançamentos empresariais por dueDate." />
          <MetricCard label="Entradas realizadas" value={currency(financial.actual.incomeActual)} money description="Entradas efetivamente pagas por paidAt." />
          <MetricCard label="Saídas realizadas" value={currency(financial.actual.expenseActual)} money description="Saídas efetivamente pagas por paidAt." />
          <MetricCard label="Resultado realizado" value={currency(financial.actual.result)} money description="Entradas pagas menos saídas pagas no período." />
          <MetricCard label="Vencido residual atual" value={currency(financial.overdue.residualBalance)} money description={`${financial.overdue.count} lançamento(s) empresarial(is) ainda não quitado(s).`} />
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Previstos usam <code>dueDate</code>; entradas, saídas e resultado usam <code>paidAt</code>. O vencido residual é uma fotografia atual de lançamentos empresariais ainda não quitados.</p>
      </section>
    </>
  );
}
