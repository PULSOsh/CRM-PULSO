"use server";

import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { hashPublicToken } from "@pulso/database/tokens";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function loadActiveVersion(proposalId: string) {
  const [version] = await db.select().from(schema.proposalVersions)
    .where(and(eq(schema.proposalVersions.proposalId, proposalId), isNotNull(schema.proposalVersions.publishedAt)))
    .orderBy(desc(schema.proposalVersions.version)).limit(1);
  return version ?? null;
}

export async function getProposalByToken(slug: string, token: string) {
  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.publicSlug, slug)).limit(1);
  if (!proposal) return null;
  if (proposal.publicTokenHash !== hashPublicToken(token)) return null;

  const version = await loadActiveVersion(proposal.id);
  if (!version) return null;

  const expired = proposal.validUntil ? new Date(proposal.validUntil) < new Date() : false;
  return { proposal, version, expired };
}

export async function trackView(proposalId: string, versionId: string) {
  const [version] = await db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.id, versionId)).limit(1);
  if (!version) return;

  await db.update(schema.proposalVersions).set({
    viewCount: version.viewCount + 1,
    viewedAt: version.viewedAt ?? new Date()
  }).where(eq(schema.proposalVersions.id, versionId));

  if (!version.viewedAt) {
    await db.insert(schema.activities).values({ entityType: "proposal", entityId: proposalId, type: "viewed", summary: "Proposta visualizada pelo cliente pela primeira vez", createdBy: "system" });
  }
}

async function requestMeta() {
  const h = await headers();
  return { ip: h.get("x-forwarded-for") ?? h.get("x-real-ip"), userAgent: h.get("user-agent") };
}

const acceptSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  document: z.string().trim().optional().or(z.literal("")),
  paymentConditionId: z.string().trim().min(1, "Selecione uma condição de pagamento."),
  selectedAddonIds: z.array(z.string()),
  declaration: z.literal(true, { message: "É necessário confirmar a declaração de aceite." })
});

export async function acceptProposal(proposalId: string, versionId: string, token: string, input: {
  name: string; document?: string; paymentConditionId: string; selectedAddonIds: string[]; declaration: boolean;
}) {
  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  if (!proposal) throw new Error("Proposta não encontrada.");
  if (proposal.publicTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");
  if (proposal.status === "accepted") throw new Error("Esta proposta já foi aceita.");
  if (proposal.status === "rejected") throw new Error("Esta proposta foi rejeitada e não pode mais ser aceita.");

  const activeVersion = await loadActiveVersion(proposalId);
  if (!activeVersion || activeVersion.id !== versionId) {
    throw new Error("Esta versão não é mais a versão vigente da proposta. Atualize a página.");
  }

  const parsed = acceptSchema.parse(input);
  const validAddonIds = new Set(activeVersion.content.addons.map((a) => a.id));
  if (!parsed.selectedAddonIds.every((id) => validAddonIds.has(id))) throw new Error("Adicional inválido selecionado.");
  const paymentCondition = activeVersion.content.paymentConditions.find((p) => p.id === parsed.paymentConditionId);
  if (!paymentCondition) throw new Error("Condição de pagamento inválida.");

  const { ip, userAgent } = await requestMeta();

  await db.update(schema.proposals).set({
    status: "accepted",
    acceptedVersionId: activeVersion.id,
    acceptedAt: new Date(),
    acceptorName: parsed.name,
    acceptorDocument: parsed.document || null,
    acceptorIp: ip,
    acceptorUserAgent: userAgent,
    acceptanceDetails: { selectedAddonIds: parsed.selectedAddonIds, paymentConditionId: parsed.paymentConditionId, declaration: "Declaro que li e aceito os termos desta proposta." },
    updatedAt: new Date()
  }).where(eq(schema.proposals.id, proposalId));

  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: proposal.opportunityId, type: "proposal_accepted", summary: `Proposta ${proposal.code} aceita por ${parsed.name}`, createdBy: "system" });

  await recordAuditEvent({
    actorType: "anonymous", action: "proposal.accepted", entityType: "proposal", entityId: proposalId,
    after: { acceptorName: parsed.name, paymentConditionId: parsed.paymentConditionId, selectedAddonIds: parsed.selectedAddonIds },
    ipAddress: ip, userAgent
  });

  revalidatePath("/app/comercial/propostas");
  return { code: proposal.code };
}

export async function rejectProposal(proposalId: string, token: string, reason: string) {
  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  if (!proposal) throw new Error("Proposta não encontrada.");
  if (proposal.publicTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");
  if (proposal.status === "accepted" || proposal.status === "rejected") throw new Error("Esta proposta já foi finalizada.");

  await db.update(schema.proposals).set({ status: "rejected", rejectedAt: new Date(), rejectionReason: reason || null, updatedAt: new Date() }).where(eq(schema.proposals.id, proposalId));
  await db.insert(schema.activities).values({ entityType: "opportunity", entityId: proposal.opportunityId, type: "proposal_rejected", summary: `Proposta ${proposal.code} rejeitada pelo cliente`, createdBy: "system" });
  await recordAuditEvent({ actorType: "anonymous", action: "proposal.rejected", entityType: "proposal", entityId: proposalId, after: { reason } });

  revalidatePath("/app/comercial/propostas");
}

export async function requestAlternativeCondition(proposalId: string, versionId: string, token: string, input: {
  label: string; entry?: string; installments: number; comment?: string;
}) {
  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  if (!proposal) throw new Error("Proposta não encontrada.");
  if (proposal.publicTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");

  // Não altera a proposta vigente -- só registra o pedido para o administrador decidir.
  await db.insert(schema.proposalChangeRequests).values({
    proposalId, proposalVersionId: versionId,
    requestedPaymentLabel: input.label,
    requestedEntry: input.entry || null,
    requestedInstallments: input.installments,
    comment: input.comment || null
  });

  await recordAuditEvent({ actorType: "anonymous", action: "proposal.alternative_condition_requested", entityType: "proposal", entityId: proposalId, after: input });
  revalidatePath("/app/comercial/propostas");
}
