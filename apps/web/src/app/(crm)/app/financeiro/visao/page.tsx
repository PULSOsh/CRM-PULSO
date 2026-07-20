import { Card, Badge } from "@pulso/ui";
import { ArrowDownRight, ArrowUpRight, Wallet, ArrowDownCircle, ArrowUpCircle, AlertOctagon } from "lucide-react";
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
    { label: "Saldo (realizado)", value: summary.balance, direction: summary.balance >= 0 ? "up" : "down", icon: Wallet },
    { label: "A receber pendente", value: summary.receivablePending, direction: "up", icon: ArrowUpCircle },
    { label: "A pagar pendente", value: summary.payablePending, direction: "down", icon: ArrowDownCircle },
  ];

  return (
    <>
      <PageHeader eyebrow="Financeiro empresarial" title="Visão financeira" description="Regime de caixa, com base em lançamentos reais — sem projeção especulativa." />
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isPositive = m.direction === "up";
          const iconColor = isPositive ? "text-emerald-500" : "text-rose-500";
          const bgHover = isPositive ? "hover:shadow-emerald-500/10 hover:border-emerald-500/30" : "hover:shadow-rose-500/10 hover:border-rose-500/30";
          
          return (
            <Card key={m.label} className={`relative overflow-hidden p-6 border border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${bgHover}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon className="size-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--soft)] border border-[var(--line)]">
                    <Icon className={`size-4 ${iconColor}`} />
                  </div>
                  {isPositive ? <ArrowUpRight className={`size-5 ${iconColor}`} /> : <ArrowDownRight className={`size-5 ${iconColor}`} />}
                </div>
                <p className="text-xs font-bold text-[var(--muted)]">{m.label}</p>
                <p className={`money-value mt-1 text-3xl font-black tracking-[-0.06em] ${isPositive ? "text-[var(--text)]" : "text-rose-500"}`}>{currency(m.value)}</p>
              </div>
            </Card>
          );
        })}
        
        <Card className="relative overflow-hidden p-6 border border-destructive/20 bg-destructive/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-destructive/10 hover:border-destructive/40">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertOctagon className="size-24 text-destructive" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 border border-destructive/30">
                <AlertOctagon className="size-4 text-destructive" />
              </div>
            </div>
            <p className="text-xs font-bold text-destructive/80">Lançamentos vencidos</p>
            <p className="money-value mt-1 text-3xl font-black tracking-[-0.06em] text-destructive">{summary.overdueCount}</p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="p-6 border border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl shadow-2xl shadow-black/5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-5 mb-8">
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-2">Fluxo de caixa</h2>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">Histórico dos últimos 14 dias.</p>
            </div>
            <Badge tone="neutral" className="shadow-sm">Regime de caixa</Badge>
          </div>
          
          <div className="flex h-64 items-end gap-3 px-2">
            {cashFlow.map((d) => {
              const isPositive = d.net >= 0;
              const height = Math.max(4, (Math.abs(d.net) / maxAbs) * 100);
              const barGradient = isPositive 
                ? "bg-gradient-to-t from-[var(--signal)]/40 to-[var(--signal)] border-t border-[var(--signal)] shadow-[0_0_15px_rgba(var(--signal-rgb),0.3)]" 
                : "bg-gradient-to-t from-rose-900/40 to-rose-600 border-t border-rose-500";
              
              return (
                <div key={d.day} className="group relative flex flex-1 flex-col justify-end gap-1 h-full cursor-crosshair">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max rounded-lg bg-[var(--carbon)] px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-xl pointer-events-none z-20">
                    <p className="font-bold">{new Date(d.day).toLocaleDateString("pt-BR")}</p>
                    <p className={`font-mono mt-0.5 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>{currency(d.net)}</p>
                  </div>
                  
                  {/* Bar */}
                  <div className="relative w-full rounded-t-md overflow-hidden transition-all duration-300 group-hover:brightness-125" style={{ height: `${height}%` }}>
                    <div className={`absolute inset-0 ${barGradient} opacity-90 group-hover:opacity-100`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-[var(--line)] pt-3 font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">
            <span>{cashFlow[0] && new Date(cashFlow[0].day).toLocaleDateString("pt-BR")}</span>
            <span>{cashFlow.at(-1) && new Date(cashFlow.at(-1)!.day).toLocaleDateString("pt-BR")}</span>
          </div>
        </Card>
      </div>
    </>
  );
}
