import { Card, Badge } from "@pulso/ui";
import { ArrowDownRight, ArrowUpRight, Wallet, ArrowDownCircle, ArrowUpCircle, AlertOctagon, Repeat, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getFinancialSummary, getRecentCashFlow, getRecurrencesSummary } from "../actions";
import Link from "next/link";

const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function FinanceOverviewPage() {
  const [summary, cashFlow, recurrences] = await Promise.all([
    getFinancialSummary("company"),
    getRecentCashFlow("company", 14),
    getRecurrencesSummary("company")
  ]);

  const maxAbs = Math.max(1, ...cashFlow.map((d) => Math.abs(d.net)));
  
  const metrics = [
    { label: "Saldo Realizado", value: summary.balance, direction: summary.balance >= 0 ? "up" : "down", icon: Wallet },
    { label: "A Receber (Mês)", value: summary.receivablePending, direction: "up", icon: ArrowUpCircle },
    { label: "A Pagar (Mês)", value: summary.payablePending, direction: "down", icon: ArrowDownCircle },
  ];

  return (
    <>
      <PageHeader 
        eyebrow="Financeiro Empresarial" 
        title="Visão Financeira" 
        description="Acompanhe o fluxo de caixa real e as projeções de dívidas e receitas mensais." 
      />
      
      {/* 
        Métricas Principais
        - Estilo Premium: Glassmorphism, bordas sutis e acentos em Laranja Fogo para destaques
      */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 mt-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isPositive = m.direction === "up";
          const isBalance = m.label === "Saldo Realizado";
          // Laranja Fogo (orange-500) ou Verde para positivo, Laranja Escuro/Vermelho para negativo
          const iconColor = isPositive ? (isBalance ? "text-[var(--signal)]" : "text-emerald-500") : "text-rose-500";
          const bgHover = isPositive 
            ? (isBalance ? "hover:shadow-orange-500/20 hover:border-[var(--signal)]/40" : "hover:shadow-emerald-500/10 hover:border-emerald-500/30") 
            : "hover:shadow-rose-500/10 hover:border-rose-500/30";
          
          return (
            <div key={m.label} className={`relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-black/50 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${bgHover}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon className="size-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
                    <Icon className={`size-5 ${iconColor}`} />
                  </div>
                  {isPositive ? <ArrowUpRight className={`size-6 ${iconColor}`} /> : <ArrowDownRight className={`size-6 ${iconColor}`} />}
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{m.label}</p>
                <p className={`money-value mt-2 text-3xl font-black tracking-tighter ${isPositive ? (isBalance ? "text-orange-400" : "text-white") : "text-rose-500"}`}>
                  {currency(m.value)}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Vencidos Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 border border-rose-500/20 bg-rose-950/20 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/20 hover:border-rose-500/50">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertOctagon className="size-24 text-rose-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 shadow-inner">
                <AlertOctagon className="size-5 text-rose-500" />
              </div>
            </div>
            <p className="text-xs font-bold text-rose-500/80 uppercase tracking-widest">Inadimplência / Atrasos</p>
            <p className="money-value mt-2 text-3xl font-black tracking-tighter text-rose-500">{summary.overdueCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        
        {/* Dívidas Mensais & Recorrências (Projeção) */}
        <div className="lg:col-span-1 rounded-3xl p-6 border border-[var(--signal)]/20 bg-gradient-to-br from-black/80 to-orange-950/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--signal)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-2 text-white">
                <Repeat className="size-5 text-[var(--signal)]" />
                Contratos Fixos
              </h2>
              <p className="mt-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Dívidas mensais & Assinaturas</p>
            </div>
            <Badge tone="warning" className="bg-[var(--signal)]/20 text-orange-400 border-[var(--signal)]/30">Projeção</Badge>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="size-4 text-rose-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Despesas Fixas / Mês</span>
              </div>
              <p className="text-2xl font-black text-rose-400 tracking-tighter">{currency(recurrences.monthlyExpense)}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Recorrente (MRR)</span>
              </div>
              <p className="text-2xl font-black text-emerald-400 tracking-tighter">{currency(recurrences.monthlyIncome)}</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Saldo Projetado:</span>
                <span className={`text-lg font-black ${recurrences.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency(recurrences.balance)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Baseado em {recurrences.activeCount} contratos ativos.</p>
            </div>

            <Link href="/app/financeiro/recorrentes" className="block w-full text-center py-2.5 mt-4 rounded-xl bg-white/5 hover:bg-[var(--signal)]/20 border border-white/10 hover:border-[var(--signal)]/40 text-sm font-bold text-white transition-all">
              Gerenciar Contratos
            </Link>
          </div>
        </div>

        {/* Fluxo de Caixa (Gráfico) */}
        <div className="lg:col-span-2 rounded-3xl p-6 border border-white/10 bg-black/50 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-2 text-white">Fluxo de Caixa</h2>
              <p className="mt-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Histórico dos últimos 14 dias.</p>
            </div>
            <Badge tone="neutral" className="bg-white/5 border-white/10 text-gray-300">Realizado</Badge>
          </div>
          
          <div className="flex h-56 items-end gap-2 sm:gap-3 px-1 sm:px-2">
            {cashFlow.map((d) => {
              const isPositive = d.net >= 0;
              const height = Math.max(4, (Math.abs(d.net) / maxAbs) * 100);
              
              // Laranja Fogo/Verde vs Vermelho escuro
              const barGradient = isPositive 
                ? "bg-gradient-to-t from-orange-500/20 to-orange-500 border-t border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]" 
                : "bg-gradient-to-t from-rose-900/40 to-rose-600 border-t border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]";
              
              return (
                <div key={d.day} className="group relative flex flex-1 flex-col justify-end gap-1 h-full cursor-crosshair">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max rounded-xl bg-black/90 border border-white/10 px-4 py-3 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-2xl pointer-events-none z-20 backdrop-blur-xl">
                    <p className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">{new Date(d.day).toLocaleDateString("pt-BR")}</p>
                    <p className={`font-black tracking-tighter ${isPositive ? "text-orange-400" : "text-rose-400"}`}>{currency(d.net)}</p>
                  </div>
                  
                  {/* Bar */}
                  <div className="relative w-full rounded-t-lg overflow-hidden transition-all duration-300 group-hover:brightness-125 group-hover:scale-y-105 origin-bottom" style={{ height: `${height}%` }}>
                    <div className={`absolute inset-0 ${barGradient} opacity-90 group-hover:opacity-100`} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-white/10 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            <span>{cashFlow[0] && new Date(cashFlow[0].day).toLocaleDateString("pt-BR")}</span>
            <span>{cashFlow.at(-1) && new Date(cashFlow.at(-1)!.day).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>
    </>
  );
}
