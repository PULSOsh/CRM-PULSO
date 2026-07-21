"use server";

import { db, schema } from "@pulso/database";
import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@pulso/database/audit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Não autorizado.");
  return session;
}

export async function addRelationshipActivity(leadId: string, message: string) {
  await requireSession();

  const [activity] = await db.insert(schema.activities).values({
    entityType: "lead",
    entityId: leadId,
    type: "note",
    summary: message,
    createdBy: "user",
    occurredAt: new Date()
  }).returning();

  await recordAuditEvent({
    actorType: "user",
    action: "relationship.note_added",
    entityType: "lead",
    entityId: leadId
  });

  revalidatePath("/app/relacionamento/mensagens");
}
