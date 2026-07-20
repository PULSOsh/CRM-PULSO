"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { desc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function searchCompaniesForTicket(q: string) {
  await requireSession();
  if (!q.trim()) return [];
  const term = `%${q.trim()}%`;
  return db.select({ id: schema.companies.id, tradeName: schema.companies.tradeName, code: schema.companies.code })
    .from(schema.companies).where(ilike(schema.companies.tradeName, term)).limit(8);
}

export async function listTickets() {
  await requireSession();
  return db.select({ ticket: schema.tickets, companyName: schema.companies.tradeName })
    .from(schema.tickets)
    .leftJoin(schema.companies, eq(schema.companies.id, schema.tickets.companyId))
    .orderBy(desc(schema.tickets.createdAt));
}

export async function getTicket(ticketId: string) {
  await requireSession();
  const [row] = await db.select({ ticket: schema.tickets, companyName: schema.companies.tradeName })
    .from(schema.tickets)
    .leftJoin(schema.companies, eq(schema.companies.id, schema.tickets.companyId))
    .where(eq(schema.tickets.id, ticketId)).limit(1);
  if (!row) return null;
  const messages = await db.select().from(schema.ticketMessages).where(eq(schema.ticketMessages.ticketId, ticketId)).orderBy(schema.ticketMessages.createdAt);
  return { ...row, messages };
}

const createSchema = z.object({
  companyId: z.string().trim().min(1, "Selecione uma empresa."),
  title: z.string().trim().min(2, "Informe um título."),
  description: z.string().trim().min(5, "Descreva o chamado.")
});

const TERMINAL_TICKET_STATUS = {
  RESOLVED: "resolved",
  CLOSED: "closed"
} as const;

const OPEN_TICKET_STATUS = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  WAITING_CUSTOMER: "waiting_customer"
} as const;

const TICKET_STATUS = { ...OPEN_TICKET_STATUS, ...TERMINAL_TICKET_STATUS } as const;
type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];
type TerminalTicketStatus = (typeof TERMINAL_TICKET_STATUS)[keyof typeof TERMINAL_TICKET_STATUS];
type OpenTicketStatus = (typeof OPEN_TICKET_STATUS)[keyof typeof OPEN_TICKET_STATUS];

export async function createTicketInternally(formData: FormData): Promise<{ error?: string; ticketId?: string }> {
  const session = await requireSession();
  const parsed = createSchema.safeParse({ companyId: formData.get("companyId"), title: formData.get("title"), description: formData.get("description") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos." };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("support", year);
  const code = formatRecordCode("support", year, sequence);
  const now = new Date();

  const [ticket] = await db.insert(schema.tickets).values({
    code, companyId: parsed.data.companyId, title: parsed.data.title, description: parsed.data.description,
    status: OPEN_TICKET_STATUS.NEW, resolutionStartedAt: now, resolvedAt: null
  }).returning();

  await db.insert(schema.ticketMessages).values({
    ticketId: ticket.id, authorType: "user", authorName: session.user.name, body: parsed.data.description, visibility: "client"
  });

  await recordAuditEvent({ actorType: "user", action: "ticket.created", entityType: "ticket", entityId: ticket.id, after: { code } });
  revalidatePath("/app/operacao/suporte");
  return { ticketId: ticket.id };
}

const replySchema = z.object({ body: z.string().trim().min(1, "Escreva uma mensagem."), visibility: z.enum(["internal", "client"]) });

export async function replyToTicket(ticketId: string, formData: FormData) {
  const session = await requireSession();
  const parsed = replySchema.safeParse({ body: formData.get("body"), visibility: formData.get("visibility") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise a mensagem.");

  await db.insert(schema.ticketMessages).values({
    ticketId, authorType: "user", authorName: session.user.name, body: parsed.data.body, visibility: parsed.data.visibility
  });
  revalidatePath(`/app/operacao/suporte/${ticketId}`);
}

const statusSchema = z.enum(Object.values(TICKET_STATUS) as [TicketStatus, ...TicketStatus[]]);

export async function updateTicketStatus(ticketId: string, formData: FormData) {
  await requireSession();
  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) throw new Error("Status inválido.");

  const [ticket] = await db.select({
    status: schema.tickets.status,
    resolutionStartedAt: schema.tickets.resolutionStartedAt,
    resolvedAt: schema.tickets.resolvedAt
  }).from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
  if (!ticket) throw new Error("Chamado não encontrado.");

  const currentStatus = statusSchema.parse(ticket.status);
  const nextStatus = parsed.data;
  const isCurrentTerminal = Object.values(TERMINAL_TICKET_STATUS).includes(currentStatus as TerminalTicketStatus);
  const isNextTerminal = Object.values(TERMINAL_TICKET_STATUS).includes(nextStatus as TerminalTicketStatus);
  const isReopening = isCurrentTerminal && Object.values(OPEN_TICKET_STATUS).includes(nextStatus as OpenTicketStatus);
  const now = new Date();

  const lifecycleUpdate = isReopening
    ? { resolutionStartedAt: now, resolvedAt: null }
    : isNextTerminal
      ? { resolutionStartedAt: ticket.resolutionStartedAt ?? now, resolvedAt: ticket.resolvedAt ?? now }
      : {};

  await db.update(schema.tickets).set({ status: nextStatus, updatedAt: now, ...lifecycleUpdate }).where(eq(schema.tickets.id, ticketId));
  await recordAuditEvent({ actorType: "user", action: "ticket.status_changed", entityType: "ticket", entityId: ticketId, after: { status: parsed.data } });
  revalidatePath(`/app/operacao/suporte/${ticketId}`);
  revalidatePath("/app/operacao/suporte");
}
