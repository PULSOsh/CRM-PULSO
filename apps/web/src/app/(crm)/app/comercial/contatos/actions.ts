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

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(160),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  document: z.string().trim().max(32).optional().or(z.literal("")),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  origin: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal(""))
});

export type ContactActionState = { error?: string; duplicateId?: string };

export async function createContact(_prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  await requireSession();

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    document: formData.get("document"),
    role: formData.get("role"),
    city: formData.get("city"),
    origin: formData.get("origin"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };
  }

  // Detecção de duplicidade por e-mail, telefone ou documento antes de criar.
  const dupConditions = [
    parsed.data.email ? eq(schema.contacts.email, parsed.data.email) : undefined,
    parsed.data.phone ? eq(schema.contacts.phone, parsed.data.phone) : undefined,
    parsed.data.document ? eq(schema.contacts.document, parsed.data.document) : undefined
  ].filter(Boolean) as ReturnType<typeof eq>[];

  if (dupConditions.length > 0) {
    const [existing] = await db.select({ id: schema.contacts.id, name: schema.contacts.name })
      .from(schema.contacts).where(or(...dupConditions)).limit(1);
    if (existing) {
      return { error: `Já existe um contato com esses dados: ${existing.name}.`, duplicateId: existing.id };
    }
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("contact", year);
  const code = formatRecordCode("contact", year, sequence);

  const [contact] = await db.insert(schema.contacts).values({
    code,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    document: parsed.data.document || null,
    role: parsed.data.role || null,
    city: parsed.data.city || null,
    origin: parsed.data.origin || null,
    notes: parsed.data.notes || null
  }).returning();

  await recordAuditEvent({
    actorType: "user", action: "contact.created", entityType: "contact", entityId: contact.id,
    after: { code: contact.code, name: contact.name }
  });

  revalidatePath("/app/comercial/contatos");
  redirect(`/app/comercial/contatos/${contact.id}`);
}

export async function updateContact(contactId: string, _prev: ContactActionState, formData: FormData): Promise<ContactActionState> {
  await requireSession();

  const parsed = contactSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone"),
    document: formData.get("document"), role: formData.get("role"), city: formData.get("city"),
    origin: formData.get("origin"), notes: formData.get("notes")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  await db.update(schema.contacts).set({
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    document: parsed.data.document || null,
    role: parsed.data.role || null,
    city: parsed.data.city || null,
    origin: parsed.data.origin || null,
    notes: parsed.data.notes || null,
    updatedAt: new Date()
  }).where(eq(schema.contacts.id, contactId));

  await recordAuditEvent({ actorType: "user", action: "contact.updated", entityType: "contact", entityId: contactId });

  revalidatePath(`/app/comercial/contatos/${contactId}`);
  revalidatePath("/app/comercial/contatos");
  return {};
}

export async function trashContact(contactId: string) {
  await requireSession();
  await db.update(schema.contacts).set({ status: "trashed", trashedAt: new Date(), updatedAt: new Date() }).where(eq(schema.contacts.id, contactId));
  await recordAuditEvent({ actorType: "user", action: "contact.trashed", entityType: "contact", entityId: contactId });
  revalidatePath("/app/comercial/contatos");
  redirect("/app/comercial/contatos");
}

export async function listContacts(params: { q?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const conditions = [isNull(schema.contacts.trashedAt)];

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(or(ilike(schema.contacts.name, term), ilike(schema.contacts.email, term), ilike(schema.contacts.phone, term))!);
  }
  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(schema.contacts).where(where).orderBy(desc(schema.contacts.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.contacts).where(where)
  ]);

  return { rows, total: count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)) };
}

// --- Empresas ---

const companySchema = z.object({
  tradeName: z.string().trim().min(2, "Informe o nome.").max(160),
  legalName: z.string().trim().max(200).optional().or(z.literal("")),
  document: z.string().trim().max(32).optional().or(z.literal("")),
  segment: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal(""))
});

export type CompanyActionState = { error?: string; duplicateId?: string };

export async function createCompany(_prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  await requireSession();

  const parsed = companySchema.safeParse({
    tradeName: formData.get("tradeName"), legalName: formData.get("legalName"), document: formData.get("document"),
    segment: formData.get("segment"), website: formData.get("website"), notes: formData.get("notes")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  if (parsed.data.document) {
    const [existing] = await db.select({ id: schema.companies.id, tradeName: schema.companies.tradeName })
      .from(schema.companies).where(eq(schema.companies.document, parsed.data.document)).limit(1);
    if (existing) return { error: `Já existe uma empresa com esse documento: ${existing.tradeName}.`, duplicateId: existing.id };
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("company", year);
  const code = formatRecordCode("company", year, sequence);

  const [company] = await db.insert(schema.companies).values({
    code,
    tradeName: parsed.data.tradeName,
    legalName: parsed.data.legalName || null,
    document: parsed.data.document || null,
    segment: parsed.data.segment || null,
    website: parsed.data.website || null,
    notes: parsed.data.notes || null
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "company.created", entityType: "company", entityId: company.id, after: { code: company.code, tradeName: company.tradeName } });

  revalidatePath("/app/comercial/contatos");
  redirect(`/app/comercial/contatos/empresas/${company.id}`);
}

export async function updateCompany(companyId: string, _prev: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  await requireSession();

  const parsed = companySchema.safeParse({
    tradeName: formData.get("tradeName"), legalName: formData.get("legalName"), document: formData.get("document"),
    segment: formData.get("segment"), website: formData.get("website"), notes: formData.get("notes")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  await db.update(schema.companies).set({
    tradeName: parsed.data.tradeName,
    legalName: parsed.data.legalName || null,
    document: parsed.data.document || null,
    segment: parsed.data.segment || null,
    website: parsed.data.website || null,
    notes: parsed.data.notes || null,
    updatedAt: new Date()
  }).where(eq(schema.companies.id, companyId));

  await recordAuditEvent({ actorType: "user", action: "company.updated", entityType: "company", entityId: companyId });

  revalidatePath(`/app/comercial/contatos/empresas/${companyId}`);
  revalidatePath("/app/comercial/contatos");
  return {};
}

export async function trashCompany(companyId: string) {
  await requireSession();
  await db.update(schema.companies).set({ status: "trashed", trashedAt: new Date(), updatedAt: new Date() }).where(eq(schema.companies.id, companyId));
  await recordAuditEvent({ actorType: "user", action: "company.trashed", entityType: "company", entityId: companyId });
  revalidatePath("/app/comercial/contatos");
  redirect("/app/comercial/contatos");
}

export async function listCompanies(params: { q?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const conditions = [isNull(schema.companies.trashedAt)];

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(or(ilike(schema.companies.tradeName, term), ilike(schema.companies.legalName, term), ilike(schema.companies.document, term))!);
  }
  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(schema.companies).where(where).orderBy(desc(schema.companies.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.companies).where(where)
  ]);

  return { rows, total: count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)) };
}

// --- Vínculo contato/empresa ---

export async function linkContactToCompany(companyId: string, formData: FormData) {
  await requireSession();
  const contactId = String(formData.get("contactId") ?? "");
  if (!contactId) throw new Error("Selecione um contato.");

  await db.insert(schema.companyContacts).values({
    companyId, contactId, relationshipRole: String(formData.get("role") ?? "") || null
  }).onConflictDoNothing();

  await recordAuditEvent({ actorType: "user", action: "company.contact_linked", entityType: "company", entityId: companyId, after: { contactId } });

  revalidatePath(`/app/comercial/contatos/empresas/${companyId}`);
}

export async function unlinkContactFromCompany(companyId: string, contactId: string) {
  await requireSession();
  await db.delete(schema.companyContacts).where(and(eq(schema.companyContacts.companyId, companyId), eq(schema.companyContacts.contactId, contactId)));
  await recordAuditEvent({ actorType: "user", action: "company.contact_unlinked", entityType: "company", entityId: companyId, after: { contactId } });
  revalidatePath(`/app/comercial/contatos/empresas/${companyId}`);
}

export async function searchContactsForLink(q: string) {
  await requireSession();
  if (!q.trim()) return [];
  const term = `%${q.trim()}%`;
  return db.select({ id: schema.contacts.id, name: schema.contacts.name, email: schema.contacts.email })
    .from(schema.contacts)
    .where(and(isNull(schema.contacts.trashedAt), or(ilike(schema.contacts.name, term), ilike(schema.contacts.email, term))))
    .limit(8);
}
