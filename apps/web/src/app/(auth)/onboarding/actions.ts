"use server";

import { auth } from "@/lib/auth";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

const adminSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(12, "A senha precisa ter no mínimo 12 caracteres.").max(128),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"]
});

export type OnboardingActionState = { error?: string };

export async function createFirstAdmin(_prev: OnboardingActionState, formData: FormData): Promise<OnboardingActionState> {
  const existing = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
  if (existing.length > 0) {
    redirect("/login");
  }

  const parsed = adminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };
  }

  const ctx = await auth.$context;
  const existingByEmail = await ctx.internalAdapter.findUserByEmail(parsed.data.email);
  if (existingByEmail) {
    return { error: "Já existe uma conta com esse e-mail." };
  }

  const hashedPassword = await ctx.password.hash(parsed.data.password);
  const user = await ctx.internalAdapter.createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    emailVerified: true,
    role: "admin"
  });
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hashedPassword
  });

  await recordAuditEvent({
    actorType: "system",
    action: "auth.admin_created",
    entityType: "user",
    entityId: user.id
  });

  redirect("/onboarding?etapa=empresa");
}

const workspaceSchema = z.object({
  workspaceName: z.string().trim().min(1, "Informe o nome da empresa.").max(160),
  legalName: z.string().trim().max(200).optional().or(z.literal("")),
  document: z.string().trim().max(32).optional().or(z.literal("")),
  monthlyRevenueGoal: z.string().trim().optional().or(z.literal(""))
});

export async function saveWorkspaceSettings(_prev: OnboardingActionState, formData: FormData): Promise<OnboardingActionState> {
  const parsed = workspaceSchema.safeParse({
    workspaceName: formData.get("workspaceName"),
    legalName: formData.get("legalName"),
    document: formData.get("document"),
    monthlyRevenueGoal: formData.get("monthlyRevenueGoal")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os campos informados." };
  }

  const goal = parsed.data.monthlyRevenueGoal?.replace(",", ".").trim();

  await db.insert(schema.appSettings).values({
    id: "singleton",
    workspaceName: parsed.data.workspaceName,
    legalName: parsed.data.legalName || null,
    document: parsed.data.document || null,
    monthlyRevenueGoal: goal ? goal : null
  }).onConflictDoUpdate({
    target: schema.appSettings.id,
    set: {
      workspaceName: parsed.data.workspaceName,
      legalName: parsed.data.legalName || null,
      document: parsed.data.document || null,
      monthlyRevenueGoal: goal ? goal : null,
      updatedAt: new Date()
    }
  });

  redirect("/onboarding?etapa=integracoes");
}

export async function finishOnboarding() {
  await db.insert(schema.appSettings).values({
    id: "singleton",
    onboardingCompletedAt: new Date()
  }).onConflictDoUpdate({
    target: schema.appSettings.id,
    set: { onboardingCompletedAt: new Date(), updatedAt: new Date() }
  });

  await recordAuditEvent({
    actorType: "system",
    action: "onboarding.completed",
    entityType: "app_settings",
    entityId: "singleton"
  });

  redirect("/app/hoje");
}

export async function getOnboardingState() {
  const [userCount, settingsRows] = await Promise.all([
    db.select({ id: schema.user.id }).from(schema.user).limit(1),
    db.select().from(schema.appSettings).where(eq(schema.appSettings.id, "singleton")).limit(1)
  ]);

  return {
    hasAdmin: userCount.length > 0,
    settings: settingsRows[0] ?? null
  };
}
