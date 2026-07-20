import "server-only";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { eq } from "drizzle-orm";

type DecideApprovalInput = {
  name: string;
  comment?: string;
  ip?: string | null;
  userAgent?: string | null;
  actor: "user" | "anonymous";
};

/** Compartilhado entre a decisão interna (admin) e a decisão pública (cliente, via link com token). */
export async function decideApproval(approvalId: string, decision: "approved" | "changes_requested", input: DecideApprovalInput) {
  const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.id, approvalId)).limit(1);
  if (!approval) throw new Error("Aprovação não encontrada.");
  if (approval.status !== "pending") throw new Error("Esta aprovação já foi decidida.");

  await db.update(schema.approvals).set({
    status: decision, decidedAt: new Date(), decidedByName: input.name,
    decisionComment: input.comment || null, decisionIp: input.ip ?? null, decisionUserAgent: input.userAgent ?? null,
    updatedAt: new Date()
  }).where(eq(schema.approvals.id, approvalId));

  await recordAuditEvent({
    actorType: input.actor, action: `approval.${decision}`, entityType: "approval", entityId: approvalId,
    after: { decision, name: input.name }, ipAddress: input.ip ?? undefined, userAgent: input.userAgent ?? undefined
  });

  return approval.projectId;
}
