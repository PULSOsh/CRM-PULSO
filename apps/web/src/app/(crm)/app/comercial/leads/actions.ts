"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(160),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(32),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  service: z.string().trim().max(160).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal(""))
});

export type LeadActionState = { error?: string };

export async function createLead(_prev: LeadActionState, formData: FormData): Promise<LeadActionState> {
  await requireSession();

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    service: formData.get("service"),
    source: formData.get("source"),
    message: formData.get("message")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("lead", year);
  const code = formatRecordCode("lead", year, sequence);

  const [lead] = await db.insert(schema.leads).values({
    code,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    companyName: parsed.data.companyName || null,
    service: parsed.data.service || null,
    source: parsed.data.source || "manual",
    message: parsed.data.message || null,
    status: "new"
  }).returning();

  await recordAuditEvent({
    actorType: "user",
    action: "lead.created",
    entityType: "lead",
    entityId: lead.id,
    after: { code: lead.code, name: lead.name, status: lead.status }
  });

  revalidatePath("/app/comercial/leads");
  redirect(`/app/comercial/leads/${lead.id}`);
}

const statusSchema = z.enum(["new", "contacted", "qualifying", "qualified", "disqualified", "converted"]);

export async function updateLeadStatus(leadId: string, status: z.infer<typeof statusSchema>, reason?: string) {
  await requireSession();
  statusSchema.parse(status);

  const [before] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
  if (!before) throw new Error("Lead não encontrado.");
  if (before.status === "converted") throw new Error("Lead já convertido não pode mudar de status.");

  if (status === "disqualified" && !reason?.trim()) {
    throw new Error("Informe o motivo da desqualificação.");
  }

  await db.update(schema.leads).set({
    status,
    disqualifiedReason: status === "disqualified" ? reason!.trim() : before.disqualifiedReason,
    updatedAt: new Date()
  }).where(eq(schema.leads.id, leadId));

  await db.insert(schema.activities).values({
    entityType: "lead",
    entityId: leadId,
    type: "status_change",
    summary: `Status alterado de ${before.status} para ${status}`,
    createdBy: "user"
  });

  await recordAuditEvent({
    actorType: "user",
    action: "lead.status_changed",
    entityType: "lead",
    entityId: leadId,
    before: { status: before.status },
    after: { status }
  });

  revalidatePath(`/app/comercial/leads/${leadId}`);
  revalidatePath("/app/comercial/leads");
}

export async function setLeadNextAction(leadId: string, nextActionAt: string) {
  await requireSession();
  const date = new Date(nextActionAt);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");

  await db.update(schema.leads).set({ nextActionAt: date, updatedAt: new Date() }).where(eq(schema.leads.id, leadId));

  await db.insert(schema.activities).values({
    entityType: "lead",
    entityId: leadId,
    type: "next_action",
    summary: `Próxima ação definida para ${date.toLocaleString("pt-BR")}`,
    createdBy: "user"
  });

  revalidatePath(`/app/comercial/leads/${leadId}`);
  revalidatePath("/app/comercial/leads");
}

export async function convertLeadToOpportunity(leadId: string) {
  await requireSession();

  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
  if (!lead) throw new Error("Lead não encontrado.");
  if (lead.status === "converted") throw new Error("Lead já foi convertido.");

  const [pipeline] = await db.select().from(schema.pipelines).where(eq(schema.pipelines.isDefault, true)).limit(1);
  if (!pipeline) throw new Error("Nenhum pipeline padrão configurado.");

  const [firstStage] = await db.select().from(schema.pipelineStages)
    .where(eq(schema.pipelineStages.pipelineId, pipeline.id))
    .orderBy(schema.pipelineStages.position)
    .limit(1);
  if (!firstStage) throw new Error("Pipeline padrão sem etapas configuradas.");

  let contactId = lead.contactId;
  if (!contactId && (lead.email || lead.phone)) {
    const year = new Date().getFullYear();
    const [existingContact] = await db.select().from(schema.contacts).where(
      or(
        lead.email ? eq(schema.contacts.email, lead.email) : sql`false`,
        lead.phone ? eq(schema.contacts.phone, lead.phone) : sql`false`
      )
    ).limit(1);

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const sequence = await nextSequence("contact", year);
      const [newContact] = await db.insert(schema.contacts).values({
        code: formatRecordCode("contact", year, sequence),
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        origin: lead.source ?? "lead"
      }).returning();
      contactId = newContact.id;
    }
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("opportunity", year);
  const code = formatRecordCode("opportunity", year, sequence);

  const [opportunity] = await db.insert(schema.opportunities).values({
    code,
    title: lead.companyName ? `${lead.name} — ${lead.companyName}` : lead.name,
    contactId,
    pipelineId: pipeline.id,
    stageId: firstStage.id,
    source: lead.source,
    status: "open"
  }).returning();

  await db.update(schema.leads).set({
    status: "converted",
    contactId,
    opportunityId: opportunity.id,
    convertedAt: new Date(),
    updatedAt: new Date()
  }).where(eq(schema.leads.id, leadId));

  await recordAuditEvent({
    actorType: "user",
    action: "lead.converted",
    entityType: "lead",
    entityId: leadId,
    after: { opportunityId: opportunity.id, opportunityCode: opportunity.code }
  });

  revalidatePath("/app/comercial/leads");
  revalidatePath("/app/comercial/oportunidades");
  redirect(`/app/comercial/oportunidades/${opportunity.id}`);
}

export async function trashLead(leadId: string) {
  await requireSession();
  await db.update(schema.leads).set({ trashedAt: new Date(), updatedAt: new Date() }).where(eq(schema.leads.id, leadId));

  await recordAuditEvent({
    actorType: "user",
    action: "lead.trashed",
    entityType: "lead",
    entityId: leadId
  });

  revalidatePath("/app/comercial/leads");
  redirect("/app/comercial/leads");
}

export async function deleteLeadPermanently(leadId: string) {
  await requireSession();

  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId)).limit(1);
  if (!lead) return;

  const linkedOpps = lead.contactId
    ? await db.select({ id: schema.opportunities.id }).from(schema.opportunities).where(eq(schema.opportunities.contactId, lead.contactId))
    : [];

  const oppIds = linkedOpps.map((o) => o.id);

  let hasBriefing = false;
  let hasProposal = false;
  let hasContract = false;

  if (oppIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const [b] = await db.select({ id: schema.briefings.id }).from(schema.briefings).where(inArray(schema.briefings.opportunityId, oppIds)).limit(1);
    const [p] = await db.select({ id: schema.proposals.id }).from(schema.proposals).where(inArray(schema.proposals.opportunityId, oppIds)).limit(1);
    const [c] = await db.select({ id: schema.contracts.id }).from(schema.contracts).where(inArray(schema.contracts.opportunityId, oppIds)).limit(1);
    
    if (b) hasBriefing = true;
    if (p) hasProposal = true;
    if (c) hasContract = true;
  }

  if (hasBriefing || hasProposal || hasContract) {
    throw new Error("Não é possível excluir este registro permanentemente pois ele possui histórico comercial (Briefing, Proposta ou Contrato). Utilize a opção Mover para Lixeira.");
  }

  // Apaga oportunidades vinculadas sem histórico comercial e o contato/cliente associado
  if (oppIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    await db.delete(schema.activities).where(and(eq(schema.activities.entityType, "opportunity"), inArray(schema.activities.entityId, oppIds)));
    await db.delete(schema.opportunities).where(inArray(schema.opportunities.id, oppIds));
  }

  if (lead.contactId) {
    await db.delete(schema.contacts).where(eq(schema.contacts.id, lead.contactId));
  }

  await db.delete(schema.activities).where(and(eq(schema.activities.entityType, "lead"), eq(schema.activities.entityId, leadId)));
  await db.update(schema.prospectingItems).set({ leadId: null, status: "not_researched" }).where(eq(schema.prospectingItems.leadId, leadId));
  await db.delete(schema.leads).where(eq(schema.leads.id, leadId));

  await recordAuditEvent({
    actorType: "user",
    action: "lead.deleted_permanently",
    entityType: "lead",
    entityId: leadId
  });

  revalidatePath("/app/comercial/leads");
  revalidatePath("/app/comercial/oportunidades");
  redirect("/app/comercial/leads");
}

export async function listLeads(params: { q?: string; status?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(schema.leads.trashedAt)];

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        ilike(schema.leads.name, term),
        ilike(schema.leads.email, term),
        ilike(schema.leads.phone, term),
        ilike(schema.leads.companyName, term)
      )!
    );
  }

  if (params.status === "no-next-action") {
    conditions.push(isNull(schema.leads.nextActionAt));
  } else if (params.status && statusSchema.safeParse(params.status).success) {
    conditions.push(eq(schema.leads.status, params.status as z.infer<typeof statusSchema>));
  }

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(schema.leads).where(where).orderBy(desc(schema.leads.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.leads).where(where)
  ]);

  return { rows, total: count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)) };
}
