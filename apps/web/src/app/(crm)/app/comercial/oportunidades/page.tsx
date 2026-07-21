import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
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
      <div className="flex-none pb-4">
        <PageHeader
          eyebrow="Comercial"
          title="Oportunidades"
          description="Pipelines configuráveis, probabilidades, valores e ações comerciais."
          actions={<Link href="/app/comercial/oportunidades/novo" className="primary-button"><Plus className="size-4" />Nova oportunidade</Link>}
        />

        {pipelines.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pipelines.map((p) => (
              <Link 
                key={p.id} 
                href={`/app/comercial/oportunidades?pipeline=${p.id}`} 
                className={`filter-chip ${p.id === pipeline.id ? "filter-chip-active" : ""}`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-4 min-w-max">
          {stages.map(({ stage, opportunities }) => (
            <div key={stage.id} className="flex flex-col w-[320px] shrink-0 rounded-2xl bg-[var(--soft)] p-3 border border-[var(--line)]">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-extrabold text-[var(--carbon)]">{stage.name}</h3>
                <Badge tone="neutral" className="bg-[var(--surface)] shadow-sm">{opportunities.length}</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
                {opportunities.map((opp) => {
                  const noNextAction = !opp.nextActionAt;
                  return (
                    <Card key={opp.id} className="p-4 hover:border-[var(--signal)] transition-colors shadow-sm group">
                      <Link href={`/app/comercial/oportunidades/${opp.id}`} className="block">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--muted)] mb-1">{opp.code}</p>
                        <p className="font-extrabold leading-tight group-hover:text-[var(--signal)] transition-colors">{opp.title}</p>
                        
                        <div className="mt-3 flex items-center justify-between bg-[var(--soft)] rounded-lg p-2 border border-[var(--line)]">
                          <p className="money-value text-sm font-bold text-[var(--signal)]">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(opp.expectedValue))}
                          </p>
                          {noNextAction && (
                            <AlertTriangle className="size-4 text-amber-500" title="Sem próxima ação" />
                          )}
                        </div>
                      </Link>
                      <div className="mt-3 pt-3 border-t border-[var(--line)]">
                        <StageSelect opportunityId={opp.id} currentStageId={stage.id} stages={allStagesList} />
                      </div>
                    </Card>
                  );
                })}
                {opportunities.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]">
                    <p className="text-xs text-[var(--muted)]">Nenhuma oportunidade.</p>
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
