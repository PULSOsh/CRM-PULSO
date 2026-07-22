"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";
import { recordAuditEvent } from "@pulso/database/audit";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

const createMemberSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  role: z.enum(["admin", "member"]).default("member"),
});

export type ActionState = { error?: string; success?: boolean };

export async function createTeamMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();

  const parsed = createMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, parsed.data.email.toLowerCase()),
  });

  if (existing) {
    return { error: "Já existe um usuário cadastrado com este e-mail." };
  }

  const newId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  await db.insert(schema.user).values({
    id: newId,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    emailVerified: true,
  });

  await recordAuditEvent({
    actorType: "user",
    actorId: session.user.id,
    action: "team_member.created",
    entityType: "user",
    entityId: newId,
    after: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/app/operacao/equipe");
  return { success: true };
}

export async function updateMemberRole(userId: string, newRole: "admin" | "member"): Promise<ActionState> {
  const session = await requireSession();

  await db
    .update(schema.user)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(schema.user.id, userId));

  await recordAuditEvent({
    actorType: "user",
    actorId: session.user.id,
    action: "team_member.role_updated",
    entityType: "user",
    entityId: userId,
    after: { role: newRole },
  });

  revalidatePath("/app/operacao/equipe");
  return { success: true };
}

export async function deleteTeamMember(userId: string): Promise<ActionState> {
  const session = await requireSession();

  if (userId === session.user.id) {
    return { error: "Você não pode remover sua própria conta de usuário." };
  }

  await db.delete(schema.user).where(eq(schema.user.id, userId));

  await recordAuditEvent({
    actorType: "user",
    actorId: session.user.id,
    action: "team_member.deleted",
    entityType: "user",
    entityId: userId,
  });

  revalidatePath("/app/operacao/equipe");
  return { success: true };
}
