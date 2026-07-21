import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { archiveBriefing, markBriefingAnalyzed } from "../actions";
import { RegenerateLink } from "./regenerate-link";
import { AIProposalButton } from "./ai-proposal-button";

const statusLabel: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", started: "Iniciado", completed: "Concluído",
  analyzed: "Analisado", skipped: "Pulado", archived: "Arquivado"
};

export default async function BriefingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [briefing] = await db.select().from(schema.briefings).where(eq(schema.briefings.id, id)).limit(1);
  if (!briefing) notFound();

  const [opportunity] = await db.select({ title: schema.opportunities.title, code: schema.opportunities.code })
    .from(schema.opportunities).where(eq(schema.opportunities.id, briefing.opportunityId)).limit(1);

  const questions = briefing.questionsSnapshot ?? [];
  const responses = (briefing.responses as Record<string, unknown>) ?? {};

  return (
    <>
      <PageHeader
        eyebrow={briefing.code}
        title={opportunity?.title ?? "Briefing"}
        description={opportunity?.code}
        actions={
          <>
            <AIProposalButton briefingId={briefing.id} />
            {briefing.status === "completed" && (
              <form action={markBriefingAnalyzed.bind(null, briefing.id)}>
                <button type="submit" className="primary-button">Marcar como analisado</button>
              </form>
            )}
            {briefing.status !== "archived" && briefing.status !== "skipped" && (
              <form action={archiveBriefing.bind(null, briefing.id)}>
                <button type="submit" className="secondary-button">Arquivar</button>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Respostas</h2>
            <Badge tone={briefing.status === "completed" || briefing.status === "analyzed" ? "success" : "signal"}>{statusLabel[briefing.status] ?? briefing.status}</Badge>
          </div>

          {briefing.status === "skipped" ? (
            <div className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm">
              <p className="text-xs font-bold text-[var(--muted)]">Motivo do pulo</p>
              <p className="mt-1">{briefing.skipReason}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {questions.length === 0 && <p className="text-sm text-[var(--muted)]">Sem perguntas neste briefing.</p>}
              {questions.map((question) => {
                const value = responses[question.id];
                const display = Array.isArray(value) ? value.join(", ") : (value as string) || "—";
                return (
                  <div key={question.id}>
                    <p className="text-xs font-bold text-[var(--muted)]">{question.label}</p>
                    <p className="mt-1 text-sm leading-6">{display || "—"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Compartilhamento</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">O link original não é mais exibido por segurança. Gere um novo se precisar reenviar.</p>
          <div className="mt-4">
            {briefing.status !== "skipped" && briefing.status !== "archived" && <RegenerateLink briefingId={briefing.id} />}
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div><dt className="text-xs font-bold text-[var(--muted)]">Progresso</dt><dd className="mt-1 font-semibold">{briefing.status === "skipped" ? "—" : `${briefing.progress}%`}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Enviado em</dt><dd className="mt-1 font-semibold">{new Date(briefing.createdAt).toLocaleString("pt-BR")}</dd></div>
            {briefing.completedAt && <div><dt className="text-xs font-bold text-[var(--muted)]">Concluído em</dt><dd className="mt-1 font-semibold">{new Date(briefing.completedAt).toLocaleString("pt-BR")}</dd></div>}
          </dl>
        </Card>
      </div>
    </>
  );
}
