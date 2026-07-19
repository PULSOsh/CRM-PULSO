import { createHash } from "node:crypto";
import { db } from "./index";
import { auditEvents } from "./schema";

export type AuditInput = {
  actorType: "user" | "portal_user" | "system" | "anonymous";
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditEvent(input: AuditInput) {
  const payload = {
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
    createdAt: new Date().toISOString(),
  };
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  await db.insert(auditEvents).values({
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? undefined,
    after: input.after ?? undefined,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    hash,
  });
}
