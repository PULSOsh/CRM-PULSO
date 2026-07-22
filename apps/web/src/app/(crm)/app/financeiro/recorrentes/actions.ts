"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}
import { db } from "@pulso/database";
import * as schema from "@pulso/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function parseMoney(v: string): number {
  const s = String(v).trim();
  if (/^\d+\.\d{1,2}$/.test(s)) return parseFloat(s);
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

const createSchema = z.object({
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  amount: z.string().trim().min(1, "Valor é obrigatório"),
  direction: z.enum(["income", "expense"]),
  type: z.string().trim().min(1, "Tipo é obrigatório"),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string().trim().min(1, "Data de início é obrigatória"),
  accountId: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
});

export type ActionState = { error?: string; success?: boolean };

export async function createRecurrence(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireSession();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const amountNumber = parseMoney(parsed.data.amount);
  if (isNaN(amountNumber) || amountNumber <= 0) return { error: "Valor inválido." };

  await db.insert(schema.financialRecurrences).values({
    scope: "company", // Assuming workspace context
    direction: parsed.data.direction,
    type: parsed.data.type,
    description: parsed.data.description,
    category: parsed.data.categoryId || null,
    accountId: parsed.data.accountId || null,
    amount: amountNumber.toString(),
    frequency: parsed.data.frequency,
    startDate: parsed.data.startDate,
    nextDueDate: parsed.data.startDate,
    status: "active",
  });

  revalidatePath("/app/financeiro/recorrentes");
  revalidatePath("/app/financeiro/visao");
  return { success: true };
}

export async function pauseRecurrence(id: string): Promise<ActionState> {
  await requireSession();
  await db.update(schema.financialRecurrences).set({ status: "paused" }).where(eq(schema.financialRecurrences.id, id));
  revalidatePath("/app/financeiro/recorrentes");
  revalidatePath("/app/financeiro/visao");
  return { success: true };
}

export async function resumeRecurrence(id: string): Promise<ActionState> {
  await requireSession();
  await db.update(schema.financialRecurrences).set({ status: "active" }).where(eq(schema.financialRecurrences.id, id));
  revalidatePath("/app/financeiro/recorrentes");
  revalidatePath("/app/financeiro/visao");
  return { success: true };
}

export async function cancelRecurrence(id: string): Promise<ActionState> {
  await requireSession();
  await db.update(schema.financialRecurrences).set({ status: "canceled" }).where(eq(schema.financialRecurrences.id, id));
  revalidatePath("/app/financeiro/recorrentes");
  revalidatePath("/app/financeiro/visao");
  return { success: true };
}

export async function deleteRecurrence(id: string): Promise<ActionState> {
  await requireSession();
  await db.delete(schema.financialRecurrences).where(eq(schema.financialRecurrences.id, id));
  revalidatePath("/app/financeiro/recorrentes");
  revalidatePath("/app/financeiro/visao");
  return { success: true };
}

export async function processDueRecurrences(): Promise<{ processedCount: number; error?: string }> {
  await requireSession();
  const todayStr = new Date().toISOString().slice(0, 10);
  
  try {
    const { and, lte } = await import("drizzle-orm");
    const dueRecurrences = await db
      .select()
      .from(schema.financialRecurrences)
      .where(
        and(
          eq(schema.financialRecurrences.status, "active"),
          lte(schema.financialRecurrences.nextDueDate, todayStr)
        )
      );

    let count = 0;
    for (const rec of dueRecurrences) {
      const code = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      await db.insert(schema.financialEntries).values({
        code,
        scope: rec.scope,
        direction: rec.direction,
        type: rec.direction === "income" ? "receivable" : "payable",
        description: `${rec.description} (Recorrente)`,
        category: rec.category,
        amountExpected: rec.amount,
        competenceDate: rec.nextDueDate,
        dueDate: rec.nextDueDate,
        status: "pending",
        recurrenceId: rec.id,
        accountId: rec.accountId,
      });

      // Calculate next due date
      const nextDate = new Date(rec.nextDueDate);
      if (rec.frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rec.frequency === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      await db
        .update(schema.financialRecurrences)
        .set({ nextDueDate: nextDate.toISOString().slice(0, 10) })
        .where(eq(schema.financialRecurrences.id, rec.id));

      count++;
    }

    revalidatePath("/app/financeiro/recorrentes");
    revalidatePath("/app/financeiro/receber");
    revalidatePath("/app/financeiro/pagar");
    revalidatePath("/app/financeiro/visao");

    return { processedCount: count };
  } catch (err: any) {
    console.error("Error processing recurrences:", err);
    return { processedCount: 0, error: err.message };
  }
}
