"use server";

import { auth } from "@/lib/auth";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { generatePublicToken } from "@pulso/database/tokens";
import { and, desc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function searchCompaniesForPortal(q: string) {
  await requireSession();
  if (!q.trim()) return [];
  const term = `%${q.trim()}%`;
  return db.select({ id: schema.companies.id, tradeName: schema.companies.tradeName, code: schema.companies.code })
    .from(schema.companies).where(ilike(schema.companies.tradeName, term)).limit(8);
}

export async function listPortalUsers() {
  await requireSession();
  return db.select({ portalUser: schema.portalUsers, companyName: schema.companies.tradeName })
    .from(schema.portalUsers)
    .innerJoin(schema.companies, eq(schema.companies.id, schema.portalUsers.companyId))
    .orderBy(desc(schema.portalUsers.createdAt));
}

export async function listCompanyProjects(companyId: string) {
  await requireSession();
  return db.select().from(schema.projects).where(eq(schema.projects.companyId, companyId)).orderBy(desc(schema.projects.createdAt));
}

export async function listPortalPermissions(portalUserId: string) {
  await requireSession();
  return db.select().from(schema.portalPermissions).where(eq(schema.portalPermissions.portalUserId, portalUserId));
}

const inviteSchema = z.object({
  companyId: z.string().trim().min(1, "Selecione uma empresa."),
  name: z.string().trim().min(2, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail válido.")
});

export async function invitePortalUser(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  const parsed = inviteSchema.safeParse({ companyId: formData.get("companyId"), name: formData.get("name"), email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos." };

  // O login do portal usa apenas e-mail + senha, sem seletor de empresa. Portanto o e-mail
  // precisa identificar uma única conta em todo o portal, mesmo que o schema legado ainda
  // mantenha o índice composto empresa/e-mail.
  const normalizedEmail = parsed.data.email.toLowerCase();
  const [existing] = await db.select({ id: schema.portalUsers.id }).from(schema.portalUsers)
    .where(eq(schema.portalUsers.email, normalizedEmail)).limit(1);
  if (existing) return { error: "Já existe um usuário de portal com esse e-mail." };

  const { token, tokenHash } = generatePublicToken();
  const [portalUser] = await db.insert(schema.portalUsers).values({
    companyId: parsed.data.companyId, name: parsed.data.name, email: normalizedEmail,
    status: "invited", activationTokenHash: tokenHash
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "portal_user.invited", entityType: "portal_user", entityId: portalUser.id, after: { email: normalizedEmail } });
  revalidatePath("/app/relacionamento/portal");
  redirect(`/app/relacionamento/portal/${portalUser.id}?invite_link_token=${token}`);
}

export async function regenerateInviteLink(portalUserId: string) {
  await requireSession();
  const [portalUser] = await db.select().from(schema.portalUsers).where(eq(schema.portalUsers.id, portalUserId)).limit(1);
  if (!portalUser) throw new Error("Usuário não encontrado.");
  if (portalUser.status !== "invited") throw new Error("Só é possível regenerar o link enquanto o convite não foi ativado.");

  const { token, tokenHash } = generatePublicToken();
  await db.update(schema.portalUsers).set({ activationTokenHash: tokenHash, updatedAt: new Date() }).where(eq(schema.portalUsers.id, portalUserId));
  await recordAuditEvent({ actorType: "user", action: "portal_user.invite_regenerated", entityType: "portal_user", entityId: portalUserId });

  revalidatePath(`/app/relacionamento/portal/${portalUserId}`);
  redirect(`/app/relacionamento/portal/${portalUserId}?invite_link_token=${token}`);
}

export async function revokePortalAccess(portalUserId: string, formData: FormData) {
  await requireSession();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Motivo da revogação é obrigatório.");

  await db.update(schema.portalUsers).set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() }).where(eq(schema.portalUsers.id, portalUserId));
  await db.delete(schema.portalSessions).where(eq(schema.portalSessions.portalUserId, portalUserId));
  await recordAuditEvent({ actorType: "user", action: "portal_user.revoked", entityType: "portal_user", entityId: portalUserId, after: { reason } });

  revalidatePath("/app/relacionamento/portal");
  revalidatePath(`/app/relacionamento/portal/${portalUserId}`);
}

export async function grantProjectAccess(portalUserId: string, projectId: string) {
  await requireSession();
  await db.insert(schema.portalPermissions).values({ portalUserId, projectId, role: "client", permissions: [] }).onConflictDoNothing();
  await recordAuditEvent({ actorType: "user", action: "portal_permission.granted", entityType: "portal_user", entityId: portalUserId, after: { projectId } });
  revalidatePath(`/app/relacionamento/portal/${portalUserId}`);
}

export async function revokeProjectAccess(portalUserId: string, projectId: string) {
  await requireSession();
  await db.delete(schema.portalPermissions).where(and(eq(schema.portalPermissions.portalUserId, portalUserId), eq(schema.portalPermissions.projectId, projectId)));
  await recordAuditEvent({ actorType: "user", action: "portal_permission.revoked", entityType: "portal_user", entityId: portalUserId, after: { projectId } });
  revalidatePath(`/app/relacionamento/portal/${portalUserId}`);
}

export async function getPortalUser(portalUserId: string) {
  await requireSession();
  const [row] = await db.select({ portalUser: schema.portalUsers, companyName: schema.companies.tradeName, companyId: schema.companies.id })
    .from(schema.portalUsers)
    .innerJoin(schema.companies, eq(schema.companies.id, schema.portalUsers.companyId))
    .where(eq(schema.portalUsers.id, portalUserId)).limit(1);
  return row ?? null;
}
