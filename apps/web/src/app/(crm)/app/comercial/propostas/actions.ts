"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { generatePublicToken, generateSlug } from "@pulso/database/tokens";
import { createHash } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ProposalContent } from "@pulso/database/schema";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

function computeTotals(content: ProposalContent) {
  const subtotal = content.scopeItems.reduce((sum, item) => sum + item.price, 0);
  return { subtotal, total: subtotal };
}

function snapshotHash(content: ProposalContent, subtotal: number, total: number) {
  return createHash("sha256").update(JSON.stringify({ content, subtotal, total })).digest("hex");
}

const emptyContent: ProposalContent = {
  intro: "", context: "", scopeTitle: "O que está incluído", scopeItems: [], addons: [], paymentConditions: [
    { id: "a-vista", label: "À vista", installments: 1 },
    { id: "3x", label: "3x sem juros", installments: 3 }
  ]
};

export type ProposalActionState = { error?: string };

const createSchema = z.object({ opportunityId: z.string().trim().min(1, "Selecione uma oportunidade.") });

export async function createProposal(_prev: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  await requireSession();
  const parsed = createSchema.safeParse({ opportunityId: formData.get("opportunityId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const eligibleBriefing = await db.select({ id: schema.briefings.id }).from(schema.briefings)
    .where(and(eq(schema.briefings.opportunityId, parsed.data.opportunityId), or(eq(schema.briefings.status, "completed"), eq(schema.briefings.status, "skipped"), eq(schema.briefings.status, "analyzed"))))
    .limit(1);
  if (eligibleBriefing.length === 0) {
    return { error: "Esta oportunidade não tem briefing concluído nem pulo justificado. Conclua o briefing antes de criar a proposta." };
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("proposal", year);
  const code = formatRecordCode("proposal", year, sequence);
  const { token, tokenHash } = generatePublicToken();
  const slug = generateSlug(code);

  const [proposal] = await db.insert(schema.proposals).values({
    code, opportunityId: parsed.data.opportunityId, publicSlug: slug, publicTokenHash: tokenHash, status: "draft"
  }).returning();

  const { subtotal, total } = computeTotals(emptyContent);
  await db.insert(schema.proposalVersions).values({
    proposalId: proposal.id, version: 1, content: emptyContent, subtotal: String(subtotal), total: String(total),
    snapshotHash: snapshotHash(emptyContent, subtotal, total)
  });

  await recordAuditEvent({ actorType: "user", action: "proposal.created", entityType: "proposal", entityId: proposal.id, after: { code } });
  revalidatePath("/app/comercial/propostas");
  redirect(`/app/comercial/propostas/${proposal.id}?link_token=${token}`);
}

const contentSchema = z.object({
  intro: z.string().trim().max(4000),
  context: z.string().trim().max(4000),
  scopeTitle: z.string().trim().max(200),
  scopeItems: z.array(z.object({ id: z.string(), label: z.string().min(1), description: z.string().optional(), price: z.number().min(0) })),
  addons: z.array(z.object({ id: z.string(), label: z.string().min(1), description: z.string().optional(), price: z.number().min(0) })),
  paymentConditions: z.array(z.object({ id: z.string(), label: z.string().min(1), installments: z.number().min(1), feePercent: z.number().optional() })),
  termsSummary: z.string().trim().max(4000).optional(),
  validUntil: z.string().trim().optional()
});

export async function saveDraftVersion(proposalId: string, versionId: string, _prev: ProposalActionState, formData: FormData): Promise<ProposalActionState> {
  await requireSession();

  const raw = formData.get("content");
  if (typeof raw !== "string") return { error: "Conteúdo inválido." };

  let parsed;
  try {
    parsed = contentSchema.parse(JSON.parse(raw));
  } catch {
    return { error: "Não foi possível interpretar o conteúdo enviado." };
  }

  const [version] = await db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.id, versionId)).limit(1);
  if (!version) return { error: "Versão não encontrada." };
  if (version.publishedAt) return { error: "Esta versão já foi publicada e não pode mais ser editada. Crie uma nova versão." };

  const content: ProposalContent = {
    intro: parsed.intro, context: parsed.context, scopeTitle: parsed.scopeTitle,
    scopeItems: parsed.scopeItems, addons: parsed.addons, paymentConditions: parsed.paymentConditions,
    termsSummary: parsed.termsSummary
  };
  const { subtotal, total } = computeTotals(content);

  await db.update(schema.proposalVersions).set({
    content, subtotal: String(subtotal), total: String(total), updatedAt: new Date()
  }).where(eq(schema.proposalVersions.id, versionId));

  if (parsed.validUntil) {
    await db.update(schema.proposals).set({ validUntil: parsed.validUntil, updatedAt: new Date() }).where(eq(schema.proposals.id, proposalId));
  }

  revalidatePath(`/app/comercial/propostas/${proposalId}`);
  return {};
}

export async function publishVersion(proposalId: string, versionId: string) {
  await requireSession();

  const [version] = await db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.id, versionId)).limit(1);
  if (!version) throw new Error("Versão não encontrada.");
  if (version.publishedAt) throw new Error("Esta versão já está publicada.");
  if (version.content.scopeItems.length === 0) throw new Error("Adicione pelo menos um item de escopo antes de publicar.");

  const { subtotal, total } = computeTotals(version.content);
  const hash = snapshotHash(version.content, subtotal, total);

  await db.update(schema.proposalVersions).set({
    subtotal: String(subtotal), total: String(total), snapshotHash: hash, publishedAt: new Date()
  }).where(eq(schema.proposalVersions.id, versionId));

  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  await db.update(schema.proposals).set({ status: "sent", updatedAt: new Date() }).where(eq(schema.proposals.id, proposalId));

  if (proposal) {
    const [opportunity] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, proposal.opportunityId)).limit(1);
    if (opportunity) {
      const [targetStage] = await db.select().from(schema.pipelineStages)
        .where(and(eq(schema.pipelineStages.pipelineId, opportunity.pipelineId), eq(schema.pipelineStages.name, "Proposta enviada"))).limit(1);
      if (targetStage && targetStage.id !== opportunity.stageId) {
        await db.update(schema.opportunities).set({ stageId: targetStage.id, updatedAt: new Date() }).where(eq(schema.opportunities.id, opportunity.id));
      }
      await db.insert(schema.activities).values({ entityType: "opportunity", entityId: opportunity.id, type: "proposal_sent", summary: `Proposta ${proposal.code} v${version.version} publicada`, createdBy: "user" });
    }
  }

  await recordAuditEvent({ actorType: "user", action: "proposal.published", entityType: "proposal", entityId: proposalId, after: { version: version.version, total } });

  revalidatePath("/app/comercial/propostas");
  revalidatePath(`/app/comercial/propostas/${proposalId}`);
}

export async function createNewVersion(proposalId: string) {
  await requireSession();

  const [latest] = await db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.proposalId, proposalId)).orderBy(desc(schema.proposalVersions.version)).limit(1);
  if (!latest) throw new Error("Nenhuma versão anterior encontrada.");
  if (!latest.publishedAt) throw new Error("Já existe uma versão em rascunho não publicada.");

  const { subtotal, total } = computeTotals(latest.content);
  await db.insert(schema.proposalVersions).values({
    proposalId, version: latest.version + 1, content: latest.content, subtotal: String(subtotal), total: String(total),
    snapshotHash: snapshotHash(latest.content, subtotal, total)
  });

  await recordAuditEvent({ actorType: "user", action: "proposal.new_version", entityType: "proposal", entityId: proposalId, after: { version: latest.version + 1 } });
  revalidatePath(`/app/comercial/propostas/${proposalId}`);
}

export async function resolveChangeRequest(requestId: string, action: "approved" | "rejected", comment: string) {
  await requireSession();
  await db.update(schema.proposalChangeRequests).set({ status: action, resolvedAt: new Date(), resolutionComment: comment || null }).where(eq(schema.proposalChangeRequests.id, requestId));
  await recordAuditEvent({ actorType: "user", action: `proposal.change_request_${action}`, entityType: "proposal_change_request", entityId: requestId });
  revalidatePath("/app/comercial/propostas");
}

export async function regenerateProposalLink(proposalId: string): Promise<{ link: string }> {
  await requireSession();
  const { token, tokenHash } = generatePublicToken();
  await db.update(schema.proposals).set({ publicTokenHash: tokenHash, updatedAt: new Date() }).where(eq(schema.proposals.id, proposalId));
  await recordAuditEvent({ actorType: "user", action: "proposal.link_regenerated", entityType: "proposal", entityId: proposalId });

  const [proposal] = await db.select({ publicSlug: schema.proposals.publicSlug }).from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  revalidatePath(`/app/comercial/propostas/${proposalId}`);
  return { link: `/proposta/${proposal.publicSlug}?token=${token}` };
}

export async function listProposals() {
  await requireSession();
  return db.select({ proposal: schema.proposals, opportunityTitle: schema.opportunities.title })
    .from(schema.proposals)
    .innerJoin(schema.opportunities, eq(schema.opportunities.id, schema.proposals.opportunityId))
    .orderBy(desc(schema.proposals.createdAt));
}

export async function searchOpportunitiesForProposal(q: string) {
  await requireSession();
  if (!q.trim()) return [];
  const { ilike } = await import("drizzle-orm");
  const term = `%${q.trim()}%`;
  return db.select({ id: schema.opportunities.id, title: schema.opportunities.title, code: schema.opportunities.code })
    .from(schema.opportunities).where(and(eq(schema.opportunities.status, "open"), ilike(schema.opportunities.title, term))).limit(8);
}
