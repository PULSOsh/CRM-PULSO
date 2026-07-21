import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { getBoardData } from "./actions";
import { KanbanBoard } from "./kanban-board";

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

      <KanbanBoard initialStages={stages} />
    </div>
  );
}
