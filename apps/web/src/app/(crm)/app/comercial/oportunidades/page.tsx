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
        <Card className="p-8 text-center text-sm text-[var(--muted)]">Nenhum pipeline configurado ainda.</Card>
      </>
    );
  }

  const allStagesList = stages.map((s) => ({ id: s.stage.id, name: s.stage.name }));

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Oportunidades"
        description="Pipelines configuráveis, probabilidades, valores e ações comerciais."
        actions={<Link href="/app/comercial/oportunidades/novo" className="primary-button"><Plus className="size-4" />Nova oportunidade</Link>}
      />

      {pipelines.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {pipelines.map((p) => (
            <Link key={p.id} href={`/app/comercial/oportunidades?pipeline=${p.id}`} className={`filter-chip ${p.id === pipeline.id ? "filter-chip-active" : ""}`}>{p.name}</Link>
          ))}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(({ stage, opportunities }) => (
          <div key={stage.id} className="w-[280px] shrink-0">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold">{stage.name}</h3>
              <Badge tone="neutral">{opportunities.length}</Badge>
            </div>
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const noNextAction = !opp.nextActionAt;
                return (
                  <Link key={opp.id} href={`/app/comercial/oportunidades/${opp.id}`}>
                    <Card className="p-4 hover:border-[var(--signal)]">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--muted)]">{opp.code}</p>
                      <p className="mt-1 font-extrabold leading-tight">{opp.title}</p>
                      <p className="money-value mt-2 text-sm font-bold text-[var(--signal)]">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(opp.expectedValue))}
                      </p>
                      {noNextAction && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-600"><AlertTriangle className="size-3.5" />Sem próxima ação</div>
                      )}
                      <div className="mt-3">
                        <StageSelect opportunityId={opp.id} currentStageId={stage.id} stages={allStagesList} />
                      </div>
                    </Card>
                  </Link>
                );
              })}
              {opportunities.length === 0 && <p className="px-1 text-xs text-[var(--muted)]">Nenhuma oportunidade.</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
