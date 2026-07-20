import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getOpportunityStagesForPipeline, markOpportunityLost, markOpportunityWon, setOpportunityNextAction, skipBriefing } from "../actions";
import { StageSelect } from "../stage-select";

const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = {
  open: "signal", won: "success", lost: "neutral"
};
const statusLabel: Record<string, string> = { open: "Aberta", won: "Fechada — ganho", lost: "Fechada — perdido" };

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [opportunity] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, id)).limit(1);
  if (!opportunity) notFound();

  const [contact, stages, activities, briefing] = await Promise.all([
    opportunity.contactId ? db.select().from(schema.contacts).where(eq(schema.contacts.id, opportunity.contactId)).limit(1).then((r) => r[0]) : null,
    getOpportunityStagesForPipeline(opportunity.pipelineId),
    db.select().from(schema.activities)
      .where(and(eq(schema.activities.entityType, "opportunity"), eq(schema.activities.entityId, id)))
      .orderBy(desc(schema.activities.occurredAt)).limit(20),
    db.select().from(schema.briefings).where(eq(schema.briefings.opportunityId, id)).limit(1).then((r) => r[0])
  ]);

  const currentStage = stages.find((s) => s.id === opportunity.stageId);
  const isOpen = opportunity.status === "open";
  const briefingPending = !briefing || !["completed", "skipped", "analyzed"].includes(briefing.status);

  return (
    <>
      <PageHeader
        eyebrow={opportunity.code}
        title={opportunity.title}
        description={contact?.name}
        actions={
          isOpen ? (
            <>
              <form action={markOpportunityWon.bind(null, opportunity.id)}>
                <button type="submit" className="primary-button">Marcar como ganho</button>
              </form>
              <details className="inline-block">
                <summary className="secondary-button inline-flex cursor-pointer list-none">Marcar como perdido</summary>
                <form action={markOpportunityLost.bind(null, opportunity.id)} className="mt-2 flex gap-2">
                  <input name="reason" placeholder="Motivo da perda" required className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
                  <button type="submit" className="secondary-button">Confirmar</button>
                </form>
              </details>
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <div className="space-y-6">
          {isOpen && briefingPending && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--warning)]/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-[var(--warning)]">Briefing pendente</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Para gerar uma proposta, esta oportunidade precisa ter o briefing respondido pelo cliente ou ser pulado pelo comercial.</p>
                </div>
                <details className="shrink-0">
                  <summary className="secondary-button cursor-pointer list-none !border-[var(--warning)]/30 !text-[var(--warning)] hover:!bg-[var(--warning)]/10">Pular Briefing</summary>
                  <form action={skipBriefing.bind(null, opportunity.id)} className="mt-3 flex flex-col gap-2 rounded-xl bg-[var(--surface)] p-3 shadow-sm border border-[var(--line)]">
                    <input name="reason" placeholder="Motivo (ex: Já tenho as infos)" required className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
                    <button type="submit" className="primary-button justify-center">Confirmar Pulo</button>
                  </form>
                </details>
              </div>
            </div>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold">Visão geral</h2>
              <Badge tone={statusTone[opportunity.status]}>{statusLabel[opportunity.status]}</Badge>
            </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-bold text-[var(--muted)]">Valor previsto</dt><dd className="money-value mt-1 font-semibold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(opportunity.expectedValue))}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Probabilidade</dt><dd className="mt-1 font-semibold">{opportunity.probability}%</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Origem</dt><dd className="mt-1 font-semibold">{opportunity.source ?? "—"}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Próxima ação</dt><dd className="mt-1 font-semibold">{opportunity.nextActionAt ? new Date(opportunity.nextActionAt).toLocaleString("pt-BR") : "Não definida"}</dd></div>
          </dl>

          {opportunity.lostReason && (
            <div className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm">
              <p className="text-xs font-bold text-[var(--muted)]">Motivo da perda</p>
              <p className="mt-1">{opportunity.lostReason}</p>
            </div>
          )}

          {isOpen && (
            <div className="mt-6 space-y-4 border-t border-[var(--line)] pt-5">
              <div>
                <p className="mb-1.5 text-xs font-bold text-[var(--muted-strong)]">Etapa do pipeline</p>
                <div className="max-w-xs">
                  <StageSelect opportunityId={opportunity.id} currentStageId={opportunity.stageId} stages={stages.map((s) => ({ id: s.id, name: s.name }))} />
                </div>
                {currentStage && <p className="mt-1 text-xs text-[var(--muted)]">Etapa atual: {currentStage.name}</p>}
              </div>
              <form action={setOpportunityNextAction.bind(null, opportunity.id)} className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="nextActionAt">Redefinir próxima ação</label>
                  <input id="nextActionAt" name="nextActionAt" type="datetime-local" required className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
                </div>
                <button type="submit" className="secondary-button">Salvar</button>
              </form>
            </div>
          )}
        </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-extrabold">Histórico</h2>
          <div className="mt-4 space-y-4">
            {activities.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma atividade registrada.</p>}
            {activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-[var(--line)] pl-3">
                <p className="text-sm font-semibold">{activity.summary}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{new Date(activity.occurredAt).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
