"use server";

import { finalizeContractIfAllSigned } from "@/lib/contract-helpers";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { hashPublicToken } from "@pulso/database/tokens";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getContractByToken(slug: string, token: string) {
  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.publicSlug, slug)).limit(1);
  if (!contract) return null;
  if (!contract.publicTokenHash || contract.publicTokenHash !== hashPublicToken(token)) return null;

  const signatories = await db.select().from(schema.contractSignatories).where(eq(schema.contractSignatories.contractId, contract.id));
  return { contract, signatories };
}

const signSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  document: z.string().trim().optional().or(z.literal("")),
  declaration: z.literal(true, { message: "Confirme a declaração de assinatura." })
});

export async function signContractPublic(contractId: string, signatoryId: string, token: string, input: { name: string; document?: string; declaration: boolean }) {
  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  if (!contract) throw new Error("Contrato não encontrado.");
  if (!contract.publicTokenHash || contract.publicTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");
  if (contract.status === "cancelled") throw new Error("Este contrato foi cancelado.");
  if (contract.status === "signed") throw new Error("Este contrato já está totalmente assinado.");

  const [signatory] = await db.select().from(schema.contractSignatories)
    .where(and(eq(schema.contractSignatories.id, signatoryId), eq(schema.contractSignatories.contractId, contractId))).limit(1);
  if (!signatory) throw new Error("Signatário não encontrado.");
  if (signatory.status === "signed") throw new Error("Você já assinou este contrato.");

  const parsed = signSchema.parse(input);
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  await db.update(schema.contractSignatories).set({
    status: "signed", signedAt: new Date(), name: parsed.name, document: parsed.document || null,
    ipAddress: ip, userAgent, declaration: "Declaro que li e assino este contrato.", updatedAt: new Date()
  }).where(eq(schema.contractSignatories.id, signatoryId));

  await db.insert(schema.contractEvents).values({ contractId, type: "signed_client", payload: { signatoryId } });
  await recordAuditEvent({ actorType: "anonymous", action: "contract.signed_client", entityType: "contract", entityId: contractId, after: { name: parsed.name }, ipAddress: ip, userAgent });

  await finalizeContractIfAllSigned(contractId);
  revalidatePath("/app/comercial/contratos");
}
