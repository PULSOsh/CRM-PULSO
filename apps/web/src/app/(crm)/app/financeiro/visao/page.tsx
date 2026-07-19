import { Card, Badge } from "@pulso/ui";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const metrics = [
  ["Saldo empresarial","R$ 14.820,00","+ R$ 4.620 no mês","up"],
  ["A receber","R$ 9.200,00","R$ 1.500 vencido","down"],
  ["A pagar","R$ 3.480,00","7 compromissos","down"],
  ["Margem prevista","52,4%","+ 4,8 p.p.","up"]
];

export default function FinancePage() {
  return (
    <>
      <PageHeader eyebrow="Financeiro empresarial" title="Visão financeira" description="Caixa, competência, margem, lucro, compromissos e metas em uma única leitura."
        actions={<button className="primary-button"><Plus className="size-4" />Novo lançamento</button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label,value,detail,direction])=>(
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between"><p className="text-xs font-bold text-[var(--muted)]">{label}</p>{direction==="up"?<ArrowUpRight className="size-4 text-emerald-600" />:<ArrowDownRight className="size-4 text-[var(--signal)]" />}</div>
            <p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-extrabold">Fluxo de caixa — próximos 30 dias</h2><Badge tone="neutral">Regime de caixa</Badge></div>
          <div className="mt-8 flex h-64 items-end gap-3 border-b border-[var(--line)] px-2">
            {[38,62,51,79,58,90,72,96,68,86,74,92].map((height,index)=><div key={index} className="flex flex-1 flex-col justify-end gap-1"><div className="rounded-t-lg bg-[var(--signal)]" style={{height:`${height}%`}} /></div>)}
          </div>
          <div className="mt-3 flex justify-between font-mono text-[9px] text-[var(--muted)]"><span>19 JUL</span><span>26 JUL</span><span>02 AGO</span><span>09 AGO</span><span>18 AGO</span></div>
        </Card>
        <Card className="p-5">
          <h2 className="font-extrabold">Meta do mês</h2>
          <div className="mt-6 grid place-items-center"><div className="grid size-48 place-items-center rounded-full bg-[conic-gradient(var(--signal)_0_67%,var(--soft)_67%_100%)] p-4"><div className="grid size-full place-items-center rounded-full bg-[var(--surface)] text-center"><div><p className="text-4xl font-black tracking-[-0.06em]">67%</p><p className="mt-1 text-xs text-[var(--muted)]">R$ 20 mil</p></div></div></div></div>
          <p className="money-value mt-5 text-center text-sm font-bold">Faltam R$ 6.700,00</p>
        </Card>
      </div>
    </>
  );
}
