import Link from "next/link";
import { AlertTriangle, Plus, LayoutDashboard, MoreHorizontal, ArrowRight } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { getBoardData } from "./actions";
import { StageSelect } from "./stage-select";

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const params = await searchParams;
  const { pipelines, pipeline, stages } = await getBoardData(params.pipeline);

  if (!pipeline) {
    return (
      <>
        <PageHeader eyebrow="Comercial" title="Oportunidades" description="Pipelines configuráveis, probabilidades, valores e ações comerciais." />
        <Card className="p-8 text-center text-sm text-[var(--muted)] mt-6">Nenhum pipeline configurado ainda.</Card>
      </>
    );
  }

  const allStagesList = stages.map((s) => ({ id: s.stage.id, name: s.stage.name }));

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div className="flex-none px-4 sm:px-6">
        <PageHeader
          eyebrow="Comercial"
          title="Oportunidades"
          description="Gestão de vendas, probabilidades e controle financeiro."
          actions={<Link href="/app/comercial/oportunidades/novo" className="primary-button shadow-lg shadow-orange-500/20"><Plus className="size-4" />Nova Oportunidade</Link>}
        />

        {pipelines.length > 1 && (
          <div className="mt-4 mb-2 flex flex-wrap gap-2">
            {pipelines.map((p) => (
              <Link 
                key={p.id} 
                href={`/app/comercial/oportunidades?pipeline=${p.id}`} 
                className={`filter-chip ${p.id === pipeline.id ? "filter-chip-active bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden mt-6 px-4 sm:px-6 scrollbar-thin">
        <div className="flex h-full gap-6 pb-6 min-w-max">
          {stages.map(({ stage, opportunities }) => (
            <div key={stage.id} className="flex flex-col w-[320px] rounded-3xl border border-white/5 bg-black/20 backdrop-blur-md p-4 shrink-0">
              <div className="mb-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  <h3 className="text-sm font-extrabold text-white">{stage.name}</h3>
                </div>
                <Badge tone="neutral" className="bg-white/10 text-gray-300 border-none">{opportunities.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {opportunities.map((opp) => {
                  const noNextAction = !opp.nextActionAt;
                  return (
                    <div key={opp.id} className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl hover:border-white/20">
                      <Link href={`/app/comercial/oportunidades/${opp.id}`} className="absolute inset-0 z-0" aria-label="Ver oportunidade"></Link>
                      
                      <div className="relative z-10 pointer-events-none">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500/80">{opp.code}</p>
                          <button type="button" className="text-gray-500 hover:text-white pointer-events-auto transition-colors"><MoreHorizontal className="size-4" /></button>
                        </div>
                        <h4 className="font-extrabold text-white text-lg leading-tight mb-3 group-hover:text-orange-400 transition-colors">{opp.title}</h4>
                        
                        <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor Esperado</p>
                            <p className="money-value text-sm font-black text-white mt-0.5">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(opp.expectedValue))}
                            </p>
                          </div>
                          {noNextAction ? (
                            <AlertTriangle className="size-5 text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                          ) : (
                            <ArrowRight className="size-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                          )}
                        </div>
                      </div>
                      
                      <div className="relative z-10 mt-3 pt-3 border-t border-white/10">
                        <StageSelect opportunityId={opp.id} currentStageId={stage.id} stages={allStagesList} />
                      </div>
                    </div>
                  );
                })}
                {opportunities.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
                    <p className="text-xs font-bold text-gray-500 flex flex-col items-center gap-2">
                      <LayoutDashboard className="size-6 text-gray-600" />
                      Nenhuma oportunidade
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
