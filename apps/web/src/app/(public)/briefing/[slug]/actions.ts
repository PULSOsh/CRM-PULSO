"use server";

import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { hashPublicToken } from "@pulso/database/tokens";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function loadAndVerify(briefingId: string, token: string) {
  const [briefing] = await db.select().from(schema.briefings).where(eq(schema.briefings.id, briefingId)).limit(1);
  if (!briefing) throw new Error("Briefing não encontrado.");
  if (briefing.publicTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");
  if (briefing.status === "archived") throw new Error("Este briefing não está mais disponível.");
  return briefing;
}

export async function getBriefingByToken(slug: string, token: string) {
  const [briefing] = await db.select().from(schema.briefings).where(eq(schema.briefings.publicSlug, slug)).limit(1);
  if (!briefing) return null;
  if (briefing.publicTokenHash !== hashPublicToken(token)) return null;
  if (briefing.status === "archived") return null;
  return briefing;
}

function computeProgress(questions: schema.BriefingQuestion[], responses: Record<string, unknown>) {
  const required = questions.filter((q) => q.required);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => {
    const value = responses[q.id];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
  return Math.round((answered.length / required.length) * 100);
}

export async function saveBriefingResponses(briefingId: string, token: string, responses: Record<string, unknown>) {
  const briefing = await loadAndVerify(briefingId, token);
  if (briefing.status === "completed" || briefing.status === "skipped") throw new Error("Este briefing já foi concluído.");

  const merged = { ...(briefing.responses as Record<string, unknown> ?? {}), ...responses };
  const progress = computeProgress(briefing.questionsSnapshot ?? [], merged);

  await db.update(schema.briefings).set({
    responses: merged,
    progress,
    status: briefing.status === "sent" ? "started" : briefing.status,
    startedAt: briefing.startedAt ?? new Date(),
    updatedAt: new Date()
  }).where(eq(schema.briefings.id, briefingId));

  return { progress };
}

export async function completeBriefing(briefingId: string, token: string) {
  const briefing = await loadAndVerify(briefingId, token);
  if (briefing.status === "completed") return;

  const questions = briefing.questionsSnapshot ?? [];
  const responses = briefing.responses as Record<string, unknown> ?? {};
  const missing = questions.filter((q) => q.required && (responses[q.id] === undefined || responses[q.id] === null || responses[q.id] === ""));
  if (missing.length > 0) throw new Error(`Responda as perguntas obrigatórias antes de concluir: ${missing.map((q) => q.label).join(", ")}`);

  await db.update(schema.briefings).set({ status: "completed", completedAt: new Date(), progress: 100, updatedAt: new Date() }).where(eq(schema.briefings.id, briefingId));

  const [opportunity] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, briefing.opportunityId)).limit(1);
  if (opportunity) {
    const [targetStage] = await db.select().from(schema.pipelineStages)
      .where(and(eq(schema.pipelineStages.pipelineId, opportunity.pipelineId), eq(schema.pipelineStages.name, "Briefing recebido"))).limit(1);
    if (targetStage && targetStage.id !== opportunity.stageId) {
      await db.update(schema.opportunities).set({ stageId: targetStage.id, updatedAt: new Date() }).where(eq(schema.opportunities.id, opportunity.id));
    }
    await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunity.id, type: "briefing_completed", summary: `Briefing ${briefing.code} concluído pelo cliente`, createdBy: "system" });
  }

  await db.insert(schema.tasks).values({
    title: `Analisar briefing ${briefing.code}`,
    status: "todo",
    priority: "normal",
    entityType: "briefing",
    entityId: briefing.id
  });

  await recordAuditEvent({ actorType: "anonymous", action: "briefing.completed", entityType: "briefing", entityId: briefing.id });

  revalidatePath("/app/comercial/briefings");
  return { protocol: briefing.code };
}
