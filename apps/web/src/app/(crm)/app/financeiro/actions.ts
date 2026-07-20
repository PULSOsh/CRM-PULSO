"use server";

import { auth } from "@/lib/auth";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function getRecurrencesSummary(scope: string) {
  await requireSession();
  const rows = await db.select().from(schema.financialRecurrences).where(eq(schema.financialRecurrences.scope, scope));
  
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  
  for (const row of rows) {
    if (row.status !== "active") continue;
    let amount = Number(row.amount);
    if (row.frequency === "weekly") amount *= 4.33;
    if (row.frequency === "yearly") amount /= 12;
    
    if (row.direction === "income") monthlyIncome += amount;
    else monthlyExpense += amount;
  }
  
  return { monthlyIncome, monthlyExpense, balance: monthlyIncome - monthlyExpense, activeCount: rows.filter(r => r.status === "active").length };
}

function parseMoney(value: string) {
  return value.replace(/\./g, "").replace(",", ".");
}

const entrySchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição."),
  category: z.string().trim().optional().or(z.literal("")),
  amountExpected: z.string().trim().min(1, "Informe o valor."),
  competenceDate: z.string().trim().min(1, "Informe a data de competência."),
  dueDate: z.string().trim().optional().or(z.literal("")),
  repeatMonths: z.string().trim().optional().or(z.literal(""))
});

export type FinancialActionState = { error?: string };

async function createEntry(scope: "company" | "personal", direction: "in" | "out", formData: FormData): Promise<FinancialActionState> {
  await requireSession();
  const parsed = entrySchema.safeParse({
    description: formData.get("description"), category: formData.get("category"),
    amountExpected: formData.get("amountExpected"), competenceDate: formData.get("competenceDate"), 
    dueDate: formData.get("dueDate"), repeatMonths: formData.get("repeatMonths")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };

  const namespace = direction === "in" ? "charge" : "expense";
  const year = new Date().getFullYear();
  
  const repeatCount = parsed.data.repeatMonths ? parseInt(parsed.data.repeatMonths, 10) : 1;
  const validRepeat = isNaN(repeatCount) || repeatCount < 1 ? 1 : repeatCount;

  for (let i = 0; i < validRepeat; i++) {
    const sequence = await nextSequence(namespace, year);
    const code = formatRecordCode(namespace, year, sequence);
    
    const competence = new Date(parsed.data.competenceDate);
    competence.setMonth(competence.getMonth() + i);
    
    let due = null;
    if (parsed.data.dueDate) {
      const dd = new Date(parsed.data.dueDate);
      dd.setMonth(dd.getMonth() + i);
      due = dd.toISOString().slice(0, 10);
    }

    const descSuffix = validRepeat > 1 ? ` (${i + 1}/${validRepeat})` : "";

    const [entry] = await db.insert(schema.financialEntries).values({
      code, scope, direction,
      type: direction === "in" ? "receivable" : "payable",
      description: parsed.data.description + descSuffix,
      category: parsed.data.category || null,
      amountExpected: parseMoney(parsed.data.amountExpected),
      competenceDate: competence.toISOString().slice(0, 10),
      dueDate: due,
      status: "pending"
    }).returning();

    await recordAuditEvent({ actorType: "user", action: "financial_entry.created", entityType: "financial_entry", entityId: entry.id, after: { code, scope, direction } });
  }

  const basePath = scope === "personal" ? "/app/financeiro/pessoal" : direction === "in" ? "/app/financeiro/receber" : "/app/financeiro/pagar";
  revalidatePath(basePath);
  revalidatePath("/app/financeiro/visao");
  return {};
}

export async function createReceivable(_prev: FinancialActionState, formData: FormData) { return createEntry("company", "in", formData); }
export async function createPayable(_prev: FinancialActionState, formData: FormData) { return createEntry("company", "out", formData); }
export async function createPersonalEntry(_prev: FinancialActionState, formData: FormData) {
  const direction = formData.get("direction") === "out" ? "out" : "in";
  return createEntry("personal", direction, formData);
}

const paymentSchema = z.object({
  amount: z.string().trim().min(1, "Informe o valor pago."),
  paidAt: z.string().trim().min(1, "Informe a data do pagamento."),
  paymentMethod: z.string().trim().min(1, "Informe o método de pagamento.")
});

export async function registerPayment(entryId: string, formData: FormData) {
  const session = await requireSession();
  const parsed = paymentSchema.safeParse({ amount: formData.get("amount"), paidAt: formData.get("paidAt"), paymentMethod: formData.get("paymentMethod") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise os campos.");

  const [entry] = await db.select().from(schema.financialEntries).where(eq(schema.financialEntries.id, entryId)).limit(1);
  if (!entry) throw new Error("Lançamento não encontrado.");
  if (entry.status === "paid" || entry.status === "cancelled") throw new Error("Este lançamento já está quitado ou cancelado.");

  const amountPaid = Number(parseMoney(parsed.data.amount));
  const newActual = Number(entry.amountActual) + amountPaid;
  const newStatus = newActual >= Number(entry.amountExpected) ? "paid" : "partial";

  await db.update(schema.financialEntries).set({
    amountActual: String(newActual), status: newStatus, paidAt: new Date(parsed.data.paidAt), paymentMethod: parsed.data.paymentMethod, updatedAt: new Date()
  }).where(eq(schema.financialEntries.id, entryId));

  await db.insert(schema.activities).values({
    entityType: "financial_entry", entityId: entryId, type: "payment_registered",
    summary: `Baixa de ${amountPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} via ${parsed.data.paymentMethod} por ${session.user.name}`,
    createdBy: "user"
  });
  await recordAuditEvent({ actorType: "user", action: "financial_entry.payment_registered", entityType: "financial_entry", entityId: entryId, after: { amountPaid, newStatus } });

  const basePath = entry.scope === "personal" ? "/app/financeiro/pessoal" : entry.direction === "in" ? "/app/financeiro/receber" : "/app/financeiro/pagar";
  revalidatePath(basePath);
  revalidatePath("/app/financeiro/visao");
}

export async function reverseEntry(entryId: string, formData: FormData) {
  await requireSession();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Motivo do estorno é obrigatório.");

  const [entry] = await db.select().from(schema.financialEntries).where(eq(schema.financialEntries.id, entryId)).limit(1);
  if (!entry) throw new Error("Lançamento não encontrado.");
  if (Number(entry.amountActual) <= 0) throw new Error("Não há valor pago para estornar.");

  const namespace = entry.direction === "in" ? "expense" : "charge";
  const year = new Date().getFullYear();
  const sequence = await nextSequence(namespace, year);
  const code = formatRecordCode(namespace, year, sequence);

  const [reversal] = await db.insert(schema.financialEntries).values({
    code, scope: entry.scope, direction: entry.direction === "in" ? "out" : "in",
    type: "reversal", description: `Estorno de ${entry.code}: ${reason}`,
    category: entry.category, amountExpected: entry.amountActual, amountActual: entry.amountActual,
    competenceDate: new Date().toISOString().slice(0, 10), paidAt: new Date(), status: "paid",
    metadata: { reversalOf: entryId, reason }
  }).returning();

  await db.update(schema.financialEntries).set({ metadata: { ...(entry.metadata as object ?? {}), reversedBy: reversal.id }, updatedAt: new Date() }).where(eq(schema.financialEntries.id, entryId));

  await recordAuditEvent({ actorType: "user", action: "financial_entry.reversed", entityType: "financial_entry", entityId: entryId, after: { reversalId: reversal.id, reason } });

  const basePath = entry.scope === "personal" ? "/app/financeiro/pessoal" : entry.direction === "in" ? "/app/financeiro/receber" : "/app/financeiro/pagar";
  revalidatePath(basePath);
  revalidatePath("/app/financeiro/visao");
}

export async function listEntries(params: { scope: "company" | "personal"; direction?: "in" | "out"; status?: string }) {
  await requireSession();
  const conditions = [eq(schema.financialEntries.scope, params.scope)];
  if (params.direction) conditions.push(eq(schema.financialEntries.direction, params.direction));
  if (params.status) conditions.push(eq(schema.financialEntries.status, params.status as "pending" | "partial" | "paid" | "overdue" | "cancelled" | "refunded"));

  return db.select().from(schema.financialEntries).where(and(...conditions)).orderBy(desc(schema.financialEntries.dueDate));
}

export async function getFinancialSummary(scope: "company" | "personal") {
  await requireSession();

  const rows = await db.select({
    direction: schema.financialEntries.direction,
    status: schema.financialEntries.status,
    amountExpected: sql<number>`sum(${schema.financialEntries.amountExpected})::float`,
    amountActual: sql<number>`sum(${schema.financialEntries.amountActual})::float`,
    count: sql<number>`count(*)::int`
  }).from(schema.financialEntries).where(eq(schema.financialEntries.scope, scope))
    .groupBy(schema.financialEntries.direction, schema.financialEntries.status);

  let receivablePending = 0, payablePending = 0, paidIn = 0, paidOut = 0, overdueCount = 0;
  for (const row of rows) {
    if (row.direction === "in" && (row.status === "pending" || row.status === "partial")) receivablePending += row.amountExpected - row.amountActual;
    if (row.direction === "out" && (row.status === "pending" || row.status === "partial")) payablePending += row.amountExpected - row.amountActual;
    if (row.direction === "in") paidIn += row.amountActual;
    if (row.direction === "out") paidOut += row.amountActual;
    if (row.status === "overdue") overdueCount += row.count;
  }

  return { receivablePending, payablePending, balance: paidIn - paidOut, overdueCount };
}

export async function getRecentCashFlow(scope: "company" | "personal", days = 14) {
  await requireSession();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const paid = await db.select({
    day: sql<string>`to_char(${schema.financialEntries.paidAt}, 'YYYY-MM-DD')`,
    direction: schema.financialEntries.direction,
    total: sql<number>`sum(${schema.financialEntries.amountActual})::float`
  }).from(schema.financialEntries)
    .where(and(eq(schema.financialEntries.scope, scope), sql`${schema.financialEntries.paidAt} >= ${since.toISOString()}`))
    .groupBy(sql`to_char(${schema.financialEntries.paidAt}, 'YYYY-MM-DD')`, schema.financialEntries.direction);

  const byDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of paid) {
    const current = byDay.get(row.day) ?? 0;
    byDay.set(row.day, current + (row.direction === "in" ? row.total : -row.total));
  }

  return Array.from(byDay.entries()).map(([day, net]) => ({ day, net }));
}
