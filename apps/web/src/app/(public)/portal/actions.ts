"use server";

import { decideApproval } from "@/lib/approval-helpers";
import { formatRecordCode } from "@/lib/code";
import { createPortalSession, destroyPortalSession, getPortalSession, hashPassword, verifyPassword } from "@/lib/portal-auth";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { hashPublicToken } from "@pulso/database/tokens";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { notifyAdmin } from "@/lib/notifications";

async function requirePortalUser() {
  const portalUser = await getPortalSession();
  if (!portalUser) redirect("/portal/login");
  return portalUser;
}

async function requireProjectAccess(projectId: string) {
  const portalUser = await requirePortalUser();
  const [permission] = await db.select().from(schema.portalPermissions)
    .where(and(eq(schema.portalPermissions.portalUserId, portalUser.id), eq(schema.portalPermissions.projectId, projectId))).limit(1);
  if (!permission) redirect("/portal");
  return portalUser;
}

export async function activatePortalUserAccount(portalUserId: string, token: string, password: string) {
  const [portalUser] = await db.select().from(schema.portalUsers).where(eq(schema.portalUsers.id, portalUserId)).limit(1);
  if (!portalUser) throw new Error("Convite não encontrado.");
  if (portalUser.status !== "invited") throw new Error("Este convite não está mais disponível.");
  if (!portalUser.activationTokenHash || portalUser.activationTokenHash !== hashPublicToken(token)) throw new Error("Link inválido ou expirado.");
  if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");

  await db.update(schema.portalUsers).set({
    passwordHash: hashPassword(password), status: "active", activationTokenHash: null, updatedAt: new Date()
  }).where(eq(schema.portalUsers.id, portalUserId));

  await recordAuditEvent({ actorType: "anonymous", action: "portal_user.activated", entityType: "portal_user", entityId: portalUserId });
}

export async function portalLogin(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  const [portalUser] = await db.select().from(schema.portalUsers).where(eq(schema.portalUsers.email, email)).limit(1);
  if (!portalUser || portalUser.status !== "active" || !portalUser.passwordHash || !verifyPassword(password, portalUser.passwordHash)) {
    return { error: "E-mail ou senha incorretos." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  await createPortalSession(portalUser.id, ip, userAgent);
  await db.update(schema.portalUsers).set({ lastLoginAt: new Date() }).where(eq(schema.portalUsers.id, portalUser.id));
  await recordAuditEvent({ actorType: "anonymous", action: "portal_user.login", entityType: "portal_user", entityId: portalUser.id, ipAddress: ip, userAgent });

  redirect("/portal");
}

export async function portalLogout() {
  await destroyPortalSession();
  redirect("/portal/login");
}

const decisionSchema = z.object({ comment: z.string().trim().optional().or(z.literal("")) });

export async function decideApprovalFromPortal(approvalId: string, projectId: string, decision: "approved" | "changes_requested", formData: FormData) {
  const portalUser = await requireProjectAccess(projectId);
  const [approval] = await db.select({ id: schema.approvals.id }).from(schema.approvals)
    .where(and(eq(schema.approvals.id, approvalId), eq(schema.approvals.projectId, projectId)))
    .limit(1);
  if (!approval) throw new Error("Aprovação não encontrada neste projeto.");

  const parsed = decisionSchema.safeParse({ comment: formData.get("comment") });
  if (!parsed.success) throw new Error("Revise os campos.");
  if (decision === "changes_requested" && !parsed.data.comment) throw new Error("Descreva o que precisa mudar.");

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  await decideApproval(approvalId, decision, { name: portalUser.name, comment: parsed.data.comment, ip, userAgent, actor: "anonymous" });
  revalidatePath(`/portal/projetos/${projectId}`);
}

const ticketSchema = z.object({
  title: z.string().trim().min(2, "Informe um título."),
  description: z.string().trim().min(5, "Descreva o que está acontecendo."),
  projectId: z.string().trim().nullish().or(z.literal(""))
});

const TERMINAL_TICKET_STATUS = {
  RESOLVED: "resolved",
  CLOSED: "closed"
} as const;

const OPEN_TICKET_STATUS = {
  NEW: "new"
} as const;

type TerminalTicketStatus = (typeof TERMINAL_TICKET_STATUS)[keyof typeof TERMINAL_TICKET_STATUS];

export async function createTicketFromPortal(formData: FormData): Promise<{ error?: string; ticketId?: string }> {
  const portalUser = await requirePortalUser();
  const parsed = ticketSchema.safeParse({ title: formData.get("title"), description: formData.get("description"), projectId: formData.get("projectId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos." };

  if (parsed.data.projectId) {
    const [permission] = await db.select({ projectId: schema.portalPermissions.projectId })
      .from(schema.portalPermissions)
      .where(and(
        eq(schema.portalPermissions.portalUserId, portalUser.id),
        eq(schema.portalPermissions.projectId, parsed.data.projectId)
      ))
      .limit(1);
    if (!permission) return { error: "Você não tem acesso ao projeto selecionado." };
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("support", year);
  const code = formatRecordCode("support", year, sequence);
  const now = new Date();

  const [ticket] = await db.insert(schema.tickets).values({
    code, companyId: portalUser.companyId, projectId: parsed.data.projectId || null,
    title: parsed.data.title, description: parsed.data.description, status: OPEN_TICKET_STATUS.NEW,
    resolutionStartedAt: now, resolvedAt: null
  }).returning();

  await db.insert(schema.ticketMessages).values({
    ticketId: ticket.id, authorType: "portal_user", authorName: portalUser.name, body: parsed.data.description, visibility: "client"
  });

  await notifyAdmin({
    eventKey: `ticket.created:${ticket.id}:${ticket.id}`,
    type: "ticket.created",
    title: `Novo chamado [${code}]: ${parsed.data.title}`,
    summary: `Cliente: ${portalUser.name}\n\n${parsed.data.description.substring(0, 400)}`,
    actionUrl: `/app/operacao/suporte/${ticket.id}`
  });

  await recordAuditEvent({ actorType: "anonymous", action: "ticket.created_from_portal", entityType: "ticket", entityId: ticket.id, after: { code } });
  revalidatePath("/portal/suporte");
  return { ticketId: ticket.id };
}

const messageSchema = z.object({ body: z.string().trim().min(1, "Escreva uma mensagem.") });

export async function replyToTicketFromPortal(ticketId: string, formData: FormData) {
  const portalUser = await requirePortalUser();
  const [ticket] = await db.select().from(schema.tickets).where(and(eq(schema.tickets.id, ticketId), eq(schema.tickets.companyId, portalUser.companyId))).limit(1);
  if (!ticket) throw new Error("Chamado não encontrado.");

  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise a mensagem.");

  const [message] = await db.insert(schema.ticketMessages).values({ ticketId, authorType: "portal_user", authorName: portalUser.name, body: parsed.data.body, visibility: "client" }).returning();
  
  if (Object.values(TERMINAL_TICKET_STATUS).includes(ticket.status as TerminalTicketStatus)) {
    const now = new Date();
    await db.update(schema.tickets).set({
      status: OPEN_TICKET_STATUS.NEW,
      resolutionStartedAt: now,
      resolvedAt: null,
      updatedAt: now
    }).where(eq(schema.tickets.id, ticketId));
  }

  await notifyAdmin({
    eventKey: `ticket.reply:${ticketId}:${message.id}`,
    type: "ticket.reply",
    title: `Nova resposta no chamado [${ticket.code}]`,
    summary: `Cliente: ${portalUser.name}\n\n${parsed.data.body.substring(0, 400)}`,
    actionUrl: `/app/operacao/suporte/${ticketId}`
  });

  revalidatePath(`/portal/suporte/${ticketId}`);
}
