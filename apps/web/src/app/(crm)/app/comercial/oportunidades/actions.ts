"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function getBoardData(pipelineId?: string) {
  const [pipelines, pipeline] = await Promise.all([
    db.select().from(schema.pipelines).where(eq(schema.pipelines.status, "active")).orderBy(asc(schema.pipelines.name)),
    pipelineId
      ? db.select().from(schema.pipelines).where(eq(schema.pipelines.id, pipelineId)).limit(1).then((r) => r[0])
      : db.select().from(schema.pipelines).where(eq(schema.pipelines.isDefault, true)).limit(1).then((r) => r[0])
  ]);

  if (!pipeline) return { pipelines, pipeline: null, stages: [] };

  const stages = await db.select().from(schema.pipelineStages)
    .where(eq(schema.pipelineStages.pipelineId, pipeline.id))
    .orderBy(asc(schema.pipelineStages.position));

  const opportunities = await db.select().from(schema.opportunities)
    .where(and(eq(schema.opportunities.pipelineId, pipeline.id), eq(schema.opportunities.status, "open")))
    .orderBy(desc(schema.opportunities.createdAt));

  const stagesWithCards = stages.map((stage) => ({
    stage,
    opportunities: opportunities.filter((o) => o.stageId === stage.id)
  }));

  return { pipelines, pipeline, stages: stagesWithCards };
}

const opportunitySchema = z.object({
  title: z.string().trim().min(2, "Informe o título.").max(200),
  contactId: z.string().trim().min(1, "É obrigatório selecionar um Cliente/Contato para criar uma oportunidade."),
  expectedValue: z.string().trim().optional().or(z.literal("")),
  nextActionAt: z.string().trim().min(1, "Toda oportunidade aberta precisa de uma próxima ação."),
  source: z.string().trim().max(80).optional().or(z.literal(""))
});

export type OpportunityActionState = { error?: string };

export async function createOpportunity(_prev: OpportunityActionState, formData: FormData): Promise<OpportunityActionState> {
  await requireSession();

  const parsed = opportunitySchema.safeParse({
    title: formData.get("title"),
    contactId: formData.get("contactId"),
    expectedValue: formData.get("expectedValue"),
    nextActionAt: formData.get("nextActionAt"),
    source: formData.get("source")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const [pipeline] = await db.select().from(schema.pipelines).where(eq(schema.pipelines.isDefault, true)).limit(1);
  if (!pipeline) return { error: "Nenhum pipeline padrão configurado." };

  const [firstStage] = await db.select().from(schema.pipelineStages)
    .where(eq(schema.pipelineStages.pipelineId, pipeline.id)).orderBy(asc(schema.pipelineStages.position)).limit(1);
  if (!firstStage) return { error: "Pipeline padrão sem etapas configuradas." };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("opportunity", year);
  const code = formatRecordCode("opportunity", year, sequence);
  const nextActionDate = new Date(parsed.data.nextActionAt);
  if (Number.isNaN(nextActionDate.getTime())) return { error: "Data de próxima ação inválida." };

  let companyId: string | null = null;
  if (parsed.data.contactId) {
    const [link] = await db.select({ companyId: schema.companyContacts.companyId }).from(schema.companyContacts)
      .where(eq(schema.companyContacts.contactId, parsed.data.contactId))
      .orderBy(desc(schema.companyContacts.isPrimary)).limit(1);
    companyId = link?.companyId ?? null;
  }

  const [opportunity] = await db.insert(schema.opportunities).values({
    code,
    title: parsed.data.title,
    contactId: parsed.data.contactId || null,
    companyId,
    pipelineId: pipeline.id,
    stageId: firstStage.id,
    expectedValue: parsed.data.expectedValue?.replace(",", ".") || "0",
    source: parsed.data.source || "manual",
    nextActionAt: nextActionDate
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "opportunity.created", entityType: "opportunity", entityId: opportunity.id, after: { code: opportunity.code } });

  revalidatePath("/app/comercial/oportunidades");
  redirect(`/app/comercial/oportunidades/${opportunity.id}`);
}

export async function moveOpportunityStage(opportunityId: string, stageId: string) {
  await requireSession();

  const [before] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, opportunityId)).limit(1);
  if (!before) throw new Error("Oportunidade não encontrada.");

  const [stage] = await db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.id, stageId)).limit(1);
  if (!stage || stage.pipelineId !== before.pipelineId) throw new Error("Etapa inválida para o pipeline atual.");

  await db.update(schema.opportunities).set({ stageId, probability: stage.defaultProbability, updatedAt: new Date() }).where(eq(schema.opportunities.id, opportunityId));

  await db.insert(schema.activities).values({
    entityType: "opportunity", entityId: opportunityId, type: "stage_change",
    summary: `Movida para a etapa "${stage.name}"`, createdBy: "user"
  });

  await recordAuditEvent({ actorType: "user", action: "opportunity.stage_changed", entityType: "opportunity", entityId: opportunityId, before: { stageId: before.stageId }, after: { stageId } });

  revalidatePath("/app/comercial/oportunidades");
  revalidatePath(`/app/comercial/oportunidades/${opportunityId}`);
}

export async function setOpportunityNextAction(opportunityId: string, formData: FormData) {
  await requireSession();
  const value = String(formData.get("nextActionAt") ?? "");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");

  await db.update(schema.opportunities).set({ nextActionAt: date, updatedAt: new Date() }).where(eq(schema.opportunities.id, opportunityId));
  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunityId, type: "next_action", summary: `Próxima ação definida para ${date.toLocaleString("pt-BR")}`, createdBy: "user" });

  revalidatePath(`/app/comercial/oportunidades/${opportunityId}`);
  revalidatePath("/app/comercial/oportunidades");
}

export async function markOpportunityWon(opportunityId: string) {
  await requireSession();
  const now = new Date();
  await db.update(schema.opportunities).set({ status: "won", closedAt: now, updatedAt: now }).where(eq(schema.opportunities.id, opportunityId));
  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunityId, type: "status_change", summary: "Fechada — ganho", createdBy: "user" });
  await recordAuditEvent({ actorType: "user", action: "opportunity.won", entityType: "opportunity", entityId: opportunityId });

  revalidatePath(`/app/comercial/oportunidades/${opportunityId}`);
  revalidatePath("/app/comercial/oportunidades");
}

export async function markOpportunityLost(opportunityId: string, formData: FormData) {
  await requireSession();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Motivo de perda é obrigatório.");

  const now = new Date();
  await db.update(schema.opportunities).set({ status: "lost", lostReason: reason, closedAt: now, updatedAt: now }).where(eq(schema.opportunities.id, opportunityId));
  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunityId, type: "status_change", summary: `Fechada — perdido (${reason})`, createdBy: "user" });
  await recordAuditEvent({ actorType: "user", action: "opportunity.lost", entityType: "opportunity", entityId: opportunityId, after: { reason } });

  revalidatePath(`/app/comercial/oportunidades/${opportunityId}`);
  revalidatePath("/app/comercial/oportunidades");
}

export async function searchContactsForOpportunity(q: string) {
  await requireSession();
  if (!q.trim()) return [];
  const term = `%${q.trim()}%`;
  const { ilike, or } = await import("drizzle-orm");
  return db.select({ id: schema.contacts.id, name: schema.contacts.name, email: schema.contacts.email })
    .from(schema.contacts)
    .where(and(isNull(schema.contacts.trashedAt), or(ilike(schema.contacts.name, term), ilike(schema.contacts.email, term))))
    .limit(8);
}

export async function getOpportunityStagesForPipeline(pipelineId: string) {
  await requireSession();
  return db.select().from(schema.pipelineStages).where(eq(schema.pipelineStages.pipelineId, pipelineId)).orderBy(asc(schema.pipelineStages.position));
}

export async function skipBriefing(opportunityId: string, formData: FormData) {
  await requireSession();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Motivo do pulo é obrigatório.");

  const [briefing] = await db.select().from(schema.briefings).where(eq(schema.briefings.opportunityId, opportunityId)).limit(1);
  if (!briefing) {
    // If there's no briefing at all, maybe we should create one as skipped?
    // Let's create a stub briefing marked as skipped so createProposal doesn't fail.
    const year = new Date().getFullYear();
    const sequence = await nextSequence("briefing", year);
    const code = formatRecordCode("briefing", year, sequence);
    const { generatePublicToken, generateSlug } = await import("@pulso/database/tokens");
    const { tokenHash } = generatePublicToken();
    const slug = generateSlug(code);
    
    await db.insert(schema.briefings).values({
      code, opportunityId, publicSlug: slug, publicTokenHash: tokenHash, status: "skipped",
      skippedAt: new Date(), skipReason: reason, progress: 100
    });
  } else {
    if (briefing.status === "completed") throw new Error("O briefing já foi concluído pelo cliente.");
    await db.update(schema.briefings).set({
      status: "skipped", skippedAt: new Date(), skipReason: reason, progress: 100, updatedAt: new Date()
    }).where(eq(schema.briefings.id, briefing.id));
  }

  await db.insert(schema.activities).values({
    entityType: "opportunity", entityId: opportunityId, type: "briefing_skipped",
    summary: `Briefing pulado pelo comercial. Motivo: ${reason}`, createdBy: "user"
  });

  revalidatePath(`/app/comercial/oportunidades/${opportunityId}`);
}

export async function updateOpportunityStage(opportunityId: string, stageId: string) {
  await requireSession();
  await db.update(schema.opportunities).set({ stageId }).where(eq(schema.opportunities.id, opportunityId));
  revalidatePath("/app/comercial/oportunidades");
}

export async function deleteOpportunity(opportunityId: string) {
  await requireSession();

  const [opp] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, opportunityId)).limit(1);
  if (!opp) return;

  const [contract] = await db.select({ id: schema.contracts.id }).from(schema.contracts).where(eq(schema.contracts.opportunityId, opportunityId)).limit(1);
  if (contract) {
    throw new Error("Não é possível excluir esta oportunidade pois ela possui um contrato associado.");
  }

  await db.delete(schema.proposals).where(eq(schema.proposals.opportunityId, opportunityId));
  await db.delete(schema.briefings).where(eq(schema.briefings.opportunityId, opportunityId));
  await db.delete(schema.activities).where(and(eq(schema.activities.entityType, "opportunity"), eq(schema.activities.entityId, opportunityId)));
  await db.delete(schema.opportunities).where(eq(schema.opportunities.id, opportunityId));

  await recordAuditEvent({
    actorType: "user",
    action: "opportunity.deleted",
    entityType: "opportunity",
    entityId: opportunityId
  });

  revalidatePath("/app/comercial/oportunidades");
}
