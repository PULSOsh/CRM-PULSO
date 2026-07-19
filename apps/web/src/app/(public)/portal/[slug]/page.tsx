import { Badge, Card } from "@pulso/ui";
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, FileCheck2, Headphones, MessageSquareText } from "lucide-react";

export default function PortalPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">Portal do cliente</p><h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">Olá, Clínica Horizonte.</h1><p className="mt-3 text-[var(--muted)]">Projetos, aprovações, documentos, pagamentos e suporte em um só lugar.</p></div>
        <Badge tone="success">Acesso seguro</Badge>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["Projetos ativos","1",BriefcaseBusiness],["Aprovações pendentes","2",FileCheck2],["Próximo pagamento","28/07",CircleDollarSign],["Chamados abertos","0",Headphones]].map(([label,value,Icon])=><Card key={String(label)} className="p-5"><Icon className="size-5 text-[var(--signal)]" /><p className="mt-5 text-xs font-bold text-[var(--muted)]">{String(label)}</p><p className="money-value mt-2 text-3xl font-black tracking-[-.05em]">{String(value)}</p></Card>)}
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><div><h2 className="font-extrabold">Site Clínica Horizonte</h2><p className="mt-1 text-xs text-[var(--muted)]">PROJ-2026-0007</p></div><Badge tone="signal">Aguardando conteúdo</Badge></div>
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div><div className="flex justify-between text-xs font-bold"><span>Progresso geral</span><span>42%</span></div><div className="mt-2 h-2 rounded-full bg-[var(--soft)]"><div className="h-full w-[42%] rounded-full bg-[var(--signal)]" /></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{["Planejamento","Design","Desenvolvimento"].map((item,index)=><div key={item} className="rounded-xl border border-[var(--line)] p-4"><p className="font-mono text-[10px] text-[var(--muted)]">ETAPA {index+1}</p><p className="mt-2 font-bold">{item}</p><p className="mt-1 text-xs text-[var(--muted)]">{index===0?"Concluída":index===1?"Em andamento":"Próxima"}</p></div>)}</div></div>
          <div className="space-y-2"><button className="secondary-button w-full justify-between"><span className="flex items-center gap-2"><FileCheck2 className="size-4" />Ver aprovações</span><ArrowRight className="size-4" /></button><button className="secondary-button w-full justify-between"><span className="flex items-center gap-2"><MessageSquareText className="size-4" />Mensagens</span><ArrowRight className="size-4" /></button><button className="secondary-button w-full justify-between"><span className="flex items-center gap-2"><Headphones className="size-4" />Abrir suporte</span><ArrowRight className="size-4" /></button></div>
        </div>
      </Card>
    </main>
  );
}
