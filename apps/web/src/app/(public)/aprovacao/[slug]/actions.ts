"use server";

import { decideApproval } from "@/lib/approval-helpers";
import { db, schema } from "@pulso/database";
import { hashPublicToken } from "@pulso/database/tokens";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getApprovalByToken(slug: string, token: string) {
  const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.publicSlug, slug)).limit(1);
  if (!approval) return null;
  if (!approval.publicTokenHash || approval.publicTokenHash !== hashPublicToken(token)) return null;

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, approval.projectId)).limit(1);
  const file = approval.fileId ? await db.select().from(schema.files).where(eq(schema.files.id, approval.fileId)).limit(1).then((r) => r[0]) : null;

  return { approval, project, file };
}

export async function decideApprovalPublic(approvalId: string, slug: string, token: string, decision: "approved" | "changes_requested", input: { name: string; comment?: string }) {
  const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.id, approvalId)).limit(1);
  if (!approval) throw new Error("Aprovação não encontrada.");
  if (approval.publicSlug !== slug || !approval.publicTokenHash || approval.publicTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");
  if (!input.name.trim()) throw new Error("Informe seu nome completo.");

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  await decideApproval(approvalId, decision, { name: input.name, comment: input.comment, ip, userAgent, actor: "anonymous" });

  revalidatePath("/app/operacao/projetos");
  revalidatePath("/app/operacao/aprovacoes");
}
