import { Card, Badge } from "@pulso/ui";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getFinancialSummary, getRecentCashFlow } from "../actions";

const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function FinanceOverviewPage() {
  const [summary, cashFlow] = await Promise.all([
    getFinancialSummary("company"),
    getRecentCashFlow("company", 14)
  ]);

  const maxAbs = Math.max(1, ...cashFlow.map((d) => Math.abs(d.net)));
  const metrics = [
    { label: "Saldo (realizado)", value: summary.balance, direction: summary.balance >= 0 ? "up" : "down" },
    { label: "A receber pendente", value: summary.receivablePending, direction: "down" },
    { label: "A pagar pendente", value: summary.payablePending, direction: "down" },
  ];

  return (
    <>
      <PageHeader eyebrow="Financeiro empresarial" title="Visão financeira" description="Regime de caixa, com base em lançamentos reais — sem projeção especulativa." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--muted)]">{m.label}</p>
              {m.direction === "up" ? <ArrowUpRight className="size-4 text-emerald-600" /> : <ArrowDownRight className="size-4 text-[var(--signal)]" />}
            </div>
            <p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{currency(m.value)}</p>
          </Card>
        ))}
        <Card className="p-5">
          <div className="flex items-center justify-between"><p className="text-xs font-bold text-[var(--muted)]">Lançamentos vencidos</p></div>
          <p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{summary.overdueCount}</p>
        </Card>
      </div>

      <div className="mt-5">
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-extrabold">Fluxo de caixa — últimos 14 dias</h2><Badge tone="neutral">Regime de caixa</Badge></div>
          <div className="mt-8 flex h-64 items-end gap-3 border-b border-[var(--line)] px-2">
            {cashFlow.map((d) => {
              const height = Math.max(4, (Math.abs(d.net) / maxAbs) * 100);
              return (
                <div key={d.day} className="flex flex-1 flex-col justify-end gap-1" title={`${d.day}: ${currency(d.net)}`}>
                  <div className={`rounded-t-lg ${d.net >= 0 ? "bg-[var(--signal)]" : "bg-[var(--muted)]"}`} style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between font-mono text-[9px] text-[var(--muted)]">
            <span>{cashFlow[0] && new Date(cashFlow[0].day).toLocaleDateString("pt-BR")}</span>
            <span>{cashFlow.at(-1) && new Date(cashFlow.at(-1)!.day).toLocaleDateString("pt-BR")}</span>
          </div>
        </Card>
      </div>
    </>
  );
}
