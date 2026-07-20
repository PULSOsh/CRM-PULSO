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

  const amountNumber = parseFloat(parsed.data.amount.replace(/\./g, "").replace(",", "."));
  if (isNaN(amountNumber) || amountNumber <= 0) return { error: "Valor inválido." };

  await db.insert(schema.financialRecurrences).values({
    scope: "pulso", // Assuming workspace context
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
