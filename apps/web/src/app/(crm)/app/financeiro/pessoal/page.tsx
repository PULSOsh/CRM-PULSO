import { Badge, Card } from "@pulso/ui";
import { EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function PersonalFinancePage() {
  return (
    <>
      <PageHeader eyebrow="Proteção adicional ativa" title="Finanças pessoais" description="Ambiente separado do caixa da PULSO, com PIN opcional e confirmação reforçada."
        actions={<button className="secondary-button"><EyeOff className="size-4" />Ocultar valores</button>} />
      <Card className="mb-5 overflow-hidden bg-[var(--carbon)] text-[var(--paper)]">
        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="grid size-12 place-items-center rounded-xl bg-[var(--signal)]"><LockKeyhole className="size-5 text-white" /></div>
          <div><h2 className="font-extrabold">Módulo protegido no dispositivo atual</h2><p className="mt-1 text-sm text-[var(--neutral)]">A busca global e as notificações não exibem valores pessoais.</p></div>
          <Badge tone="success">Desbloqueado</Badge>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[["Patrimônio líquido","R$ 26.400,00","Ativos menos dívidas"],["Dívidas pessoais","R$ 10.000,00","Plano de quitação ativo"],["Reserva de emergência","R$ 4.200,00","1,4 de 6 meses"]].map(([label,value,detail])=>(
          <Card key={label} className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[var(--muted)]">{label}</p><ShieldCheck className="size-4 text-[var(--signal)]" /></div><p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{detail}</p></Card>
        ))}
      </div>
    </>
  );
}
