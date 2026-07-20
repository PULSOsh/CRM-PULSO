"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { generatePublicToken, generateSlug } from "@pulso/database/tokens";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

async function advanceOpportunityStage(opportunityId: string, stageName: string) {
  const [opportunity] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, opportunityId)).limit(1);
  if (!opportunity) return;

  const [targetStage] = await db.select().from(schema.pipelineStages)
    .where(and(eq(schema.pipelineStages.pipelineId, opportunity.pipelineId), eq(schema.pipelineStages.name, stageName))).limit(1);
  if (!targetStage || targetStage.id === opportunity.stageId) return;

  await db.update(schema.opportunities).set({ stageId: targetStage.id, updatedAt: new Date() }).where(eq(schema.opportunities.id, opportunityId));
  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunityId, type: "stage_change", summary: `Movida automaticamente para "${stageName}"`, createdBy: "system" });
}

const createSchema = z.object({
  opportunityId: z.string().trim().min(1, "Selecione uma oportunidade."),
  productId: z.string().trim().optional().or(z.literal(""))
});

export type BriefingActionState = { error?: string; link?: string; code?: string };

export async function createBriefing(_prev: BriefingActionState, formData: FormData): Promise<BriefingActionState> {
  await requireSession();

  const parsed = createSchema.safeParse({ opportunityId: formData.get("opportunityId"), productId: formData.get("productId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const [opportunity] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, parsed.data.opportunityId)).limit(1);
  if (!opportunity) return { error: "Oportunidade não encontrada." };

  let template = null;
  if (parsed.data.productId) {
    const [product] = await db.select({ briefingTemplateId: schema.products.briefingTemplateId }).from(schema.products).where(eq(schema.products.id, parsed.data.productId)).limit(1);
    if (product?.briefingTemplateId) {
      const [t] = await db.select().from(schema.briefingTemplates).where(eq(schema.briefingTemplates.id, product.briefingTemplateId)).limit(1);
      template = t;
    }
  }

  if (!template) {
    const [t] = await db.select().from(schema.briefingTemplates).where(eq(schema.briefingTemplates.isDefault, true)).limit(1);
    template = t;
  }

  if (!template) return { error: "Nenhum template de briefing configurado." };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("briefing", year);
  const code = formatRecordCode("briefing", year, sequence);
  const { token, tokenHash } = generatePublicToken();
  const slug = generateSlug(code);

  const [briefing] = await db.insert(schema.briefings).values({
    code,
    opportunityId: opportunity.id,
    productId: parsed.data.productId || null,
    templateId: template.id,
    templateVersion: template.version,
    questionsSnapshot: template.questions,
    publicSlug: slug,
    publicTokenHash: tokenHash,
    status: "sent"
  }).returning();

  await advanceOpportunityStage(opportunity.id, "Briefing solicitado");
  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunity.id, type: "briefing_sent", summary: `Briefing ${code} enviado`, createdBy: "user" });
  await recordAuditEvent({ actorType: "user", action: "briefing.created", entityType: "briefing", entityId: briefing.id, after: { code } });

  revalidatePath("/app/comercial/briefings");
  return { link: `/briefing/${slug}?token=${token}`, code };
}

const skipSchema = z.object({
  opportunityId: z.string().trim().min(1),
  productId: z.string().trim().min(1, "Selecione o produto elegível para pular o briefing."),
  reason: z.string().trim().min(5, "Justificativa é obrigatória (mínimo 5 caracteres).")
});

export async function skipBriefing(_prev: BriefingActionState, formData: FormData): Promise<BriefingActionState> {
  await requireSession();

  const parsed = skipSchema.safeParse({ opportunityId: formData.get("opportunityId"), productId: formData.get("productId"), reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, parsed.data.productId)).limit(1);
  if (!product) return { error: "Produto não encontrado." };
  if (!product.allowBriefingSkip) return { error: "Este produto não permite pular o briefing." };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("briefing", year);
  const code = formatRecordCode("briefing", year, sequence);
  const { tokenHash } = generatePublicToken();
  const slug = generateSlug(code);

  const [briefing] = await db.insert(schema.briefings).values({
    code,
    opportunityId: parsed.data.opportunityId,
    productId: product.id,
    publicSlug: slug,
    publicTokenHash: tokenHash,
    status: "skipped",
    skippedAt: new Date(),
    skipReason: parsed.data.reason
  }).returning();

  await advanceOpportunityStage(parsed.data.opportunityId, "Diagnóstico");
  await recordAuditEvent({ actorType: "user", action: "briefing.skipped", entityType: "briefing", entityId: briefing.id, after: { reason: parsed.data.reason, productId: product.id } });

  revalidatePath("/app/comercial/briefings");
  return { code };
}

export async function regenerateBriefingLink(briefingId: string): Promise<{ link: string }> {
  await requireSession();
  const { token, tokenHash } = generatePublicToken();

  await db.update(schema.briefings).set({ publicTokenHash: tokenHash, updatedAt: new Date() }).where(eq(schema.briefings.id, briefingId));
  await recordAuditEvent({ actorType: "user", action: "briefing.link_regenerated", entityType: "briefing", entityId: briefingId });

  const [briefing] = await db.select({ publicSlug: schema.briefings.publicSlug }).from(schema.briefings).where(eq(schema.briefings.id, briefingId)).limit(1);
  revalidatePath("/app/comercial/briefings");
  return { link: `/briefing/${briefing.publicSlug}?token=${token}` };
}

export async function markBriefingAnalyzed(briefingId: string) {
  await requireSession();
  await db.update(schema.briefings).set({ status: "analyzed", analyzedAt: new Date(), updatedAt: new Date() }).where(eq(schema.briefings.id, briefingId));
  await recordAuditEvent({ actorType: "user", action: "briefing.analyzed", entityType: "briefing", entityId: briefingId });
  revalidatePath("/app/comercial/briefings");
  revalidatePath(`/app/comercial/briefings/${briefingId}`);
}

export async function archiveBriefing(briefingId: string) {
  await requireSession();
  await db.update(schema.briefings).set({ status: "archived", updatedAt: new Date() }).where(eq(schema.briefings.id, briefingId));
  await recordAuditEvent({ actorType: "user", action: "briefing.archived", entityType: "briefing", entityId: briefingId });
  revalidatePath("/app/comercial/briefings");
}

export async function listBriefings() {
  await requireSession();
  return db.select({
    briefing: schema.briefings,
    opportunityTitle: schema.opportunities.title,
    opportunityCode: schema.opportunities.code
  }).from(schema.briefings)
    .innerJoin(schema.opportunities, eq(schema.opportunities.id, schema.briefings.opportunityId))
    .orderBy(desc(schema.briefings.createdAt));
}

export async function searchOpportunitiesForBriefing(q: string) {
  await requireSession();
  if (!q.trim()) return [];
  const { ilike } = await import("drizzle-orm");
  const term = `%${q.trim()}%`;
  return db.select({ id: schema.opportunities.id, title: schema.opportunities.title, code: schema.opportunities.code })
    .from(schema.opportunities).where(and(eq(schema.opportunities.status, "open"), ilike(schema.opportunities.title, term))).limit(8);
}

export async function listEligibleProductsForSkip() {
  await requireSession();
  return db.select().from(schema.products).where(and(eq(schema.products.allowBriefingSkip, true), eq(schema.products.status, "active")));
}
