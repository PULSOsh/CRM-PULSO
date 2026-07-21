"use server";

import { auth } from "@/lib/auth";
import { decideApproval } from "@/lib/approval-helpers";
import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { generatePublicToken, generateSlug } from "@pulso/database/tokens";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

// ---------------------------------------------------------------------------
// Projetos
// ---------------------------------------------------------------------------

export async function generateProjectFromContract(contractId: string): Promise<{ error?: string; projectId?: string }> {
  await requireSession();

  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, contractId)).limit(1);
  if (!contract) return { error: "Contrato não encontrado." };
  if (contract.status !== "signed") return { error: "Só é possível gerar projeto de um contrato assinado." };

  const [existing] = await db.select({ id: schema.projects.id }).from(schema.projects).where(eq(schema.projects.contractId, contractId)).limit(1);
  if (existing) return { projectId: existing.id };

  const [opportunity] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, contract.opportunityId)).limit(1);
  const content = contract.content as { totalValue?: number };

  const year = new Date().getFullYear();
  const sequence = await nextSequence("project", year);
  const code = formatRecordCode("project", year, sequence);

  const [project] = await db.insert(schema.projects).values({
    code,
    name: opportunity?.title ?? `Projeto ${code}`,
    companyId: opportunity?.companyId ?? null,
    contactId: opportunity?.contactId ?? null,
    opportunityId: contract.opportunityId,
    contractId,
    status: "planned",
    budget: String(content.totalValue ?? 0)
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "project.created", entityType: "project", entityId: project.id, after: { code, contractId } });
  revalidatePath("/app/operacao/projetos");
  return { projectId: project.id };
}

export async function createStandaloneProject(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await requireSession();
  
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const projectType = (formData.get("projectType") as string) || "avulso";
  const budget = formData.get("budget") as string;
  const monthlyValue = formData.get("monthlyValue") as string;
  const estimatedHours = formData.get("estimatedHours") as string;

  if (!name || name.trim().length === 0) {
    return { error: "O nome do projeto é obrigatório." };
  }

  const year = new Date().getFullYear();
  const sequence = await nextSequence("project", year);
  const code = formatRecordCode("project", year, sequence);

  const [project] = await db.insert(schema.projects).values({
    code,
    name: name.trim(),
    description: description?.trim() || null,
    projectType,
    monthlyValue: monthlyValue ? String(Number(monthlyValue)) : "0",
    budget: budget ? String(Number(budget)) : (monthlyValue ? String(Number(monthlyValue)) : "0"),
    estimatedHours: estimatedHours ? String(Number(estimatedHours)) : "0",
    status: "planned",
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "project.created", entityType: "project", entityId: project.id, after: { code, projectType, standalone: true } });
  revalidatePath("/app/operacao/projetos");
  redirect(`/app/operacao/projetos/${project.id}`);
}

export async function listProjects() {
  await requireSession();
  return db.select().from(schema.projects).orderBy(desc(schema.projects.createdAt));
}

export async function listSignedContractsWithoutProject() {
  await requireSession();
  const contracts = await db.select({ contract: schema.contracts, opportunityTitle: schema.opportunities.title })
    .from(schema.contracts)
    .innerJoin(schema.opportunities, eq(schema.opportunities.id, schema.contracts.opportunityId))
    .where(eq(schema.contracts.status, "signed"));

  const withProjects = await db.select({ contractId: schema.projects.contractId }).from(schema.projects);
  const taken = new Set(withProjects.map((p) => p.contractId));

  return contracts.filter(({ contract }) => !taken.has(contract.id));
}

const projectStatusSchema = z.enum(["planned", "active", "waiting", "completed", "cancelled"]);

export async function updateProjectStatus(projectId: string, formData: FormData) {
  await requireSession();
  const parsedStatus = projectStatusSchema.safeParse(formData.get("status"));
  if (!parsedStatus.success) throw new Error("Status inválido.");
  const status = parsedStatus.data;

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).limit(1);
  if (!project) throw new Error("Projeto não encontrado.");

  if (status === "completed") {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.approvals)
      .where(and(eq(schema.approvals.projectId, projectId), eq(schema.approvals.status, "pending")));
    if (count > 0) throw new Error("Existem aprovações pendentes — não é possível concluir o projeto.");
  }

  const warrantyEndsAt = String(formData.get("warrantyEndsAt") ?? "").trim();

  await db.update(schema.projects).set({
    status,
    deliveredAt: status === "completed" ? new Date() : project.deliveredAt,
    warrantyEndsAt: status === "completed" ? (warrantyEndsAt || project.warrantyEndsAt) : project.warrantyEndsAt,
    updatedAt: new Date()
  }).where(eq(schema.projects.id, projectId));

  await recordAuditEvent({ actorType: "user", action: "project.status_changed", entityType: "project", entityId: projectId, after: { status } });
  revalidatePath(`/app/operacao/projetos/${projectId}`);
  revalidatePath("/app/operacao/projetos");
}

// ---------------------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------------------

const taskSchema = z.object({
  title: z.string().trim().min(2, "Informe o título."),
  dueAt: z.string().trim().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"])
});

export async function createTask(projectId: string | null, formData: FormData) {
  await requireSession();
  const parsed = taskSchema.safeParse({
    title: formData.get("title"), dueAt: formData.get("dueAt"), priority: formData.get("priority") || "normal"
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise os campos.");

  await db.insert(schema.tasks).values({
    title: parsed.data.title,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    priority: parsed.data.priority,
    entityType: projectId ? "project" : null,
    entityId: projectId
  });

  revalidatePath("/app/operacao/tarefas");
  revalidatePath("/app/hoje");
  if (projectId) revalidatePath(`/app/operacao/projetos/${projectId}`);
}

export async function toggleTask(taskId: string, done: boolean) {
  await requireSession();
  const [task] = await db.update(schema.tasks).set({ status: done ? "done" : "todo", updatedAt: new Date() })
    .where(eq(schema.tasks.id, taskId)).returning();

  revalidatePath("/app/operacao/tarefas");
  revalidatePath("/app/hoje");
  if (task?.entityType === "project" && task.entityId) revalidatePath(`/app/operacao/projetos/${task.entityId}`);
}

export async function listTasks() {
  await requireSession();
  return db.select().from(schema.tasks).orderBy(schema.tasks.dueAt);
}

export async function listProjectTasks(projectId: string) {
  await requireSession();
  return db.select().from(schema.tasks).where(and(eq(schema.tasks.entityType, "project"), eq(schema.tasks.entityId, projectId))).orderBy(schema.tasks.createdAt);
}

// ---------------------------------------------------------------------------
// Arquivos (upload/download já existem em /api/files — aqui só listagem e lixeira)
// ---------------------------------------------------------------------------

export async function listFiles(params: { entityType?: string; entityId?: string; includeTrashed?: boolean } = {}) {
  await requireSession();
  const conditions = [];
  if (params.entityType) conditions.push(eq(schema.files.entityType, params.entityType));
  if (params.entityId) conditions.push(eq(schema.files.entityId, params.entityId));
  if (!params.includeTrashed) conditions.push(isNull(schema.files.trashedAt));

  return db.select().from(schema.files).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(schema.files.createdAt));
}

export async function trashFile(fileId: string, projectId?: string) {
  await requireSession();
  await db.update(schema.files).set({ trashedAt: new Date(), updatedAt: new Date() }).where(eq(schema.files.id, fileId));
  await recordAuditEvent({ actorType: "user", action: "file.trashed", entityType: "file", entityId: fileId });
  revalidatePath("/app/operacao/arquivos");
  if (projectId) revalidatePath(`/app/operacao/projetos/${projectId}`);
}

export async function restoreFile(fileId: string, projectId?: string) {
  await requireSession();
  await db.update(schema.files).set({ trashedAt: null, updatedAt: new Date() }).where(eq(schema.files.id, fileId));
  await recordAuditEvent({ actorType: "user", action: "file.restored", entityType: "file", entityId: fileId });
  revalidatePath("/app/operacao/arquivos");
  if (projectId) revalidatePath(`/app/operacao/projetos/${projectId}`);
}

// ---------------------------------------------------------------------------
// Aprovações
// ---------------------------------------------------------------------------

const approvalSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da aprovação."),
  instructions: z.string().trim().optional().or(z.literal("")),
  fileId: z.string().trim().optional().or(z.literal("")),
  dueAt: z.string().trim().optional().or(z.literal(""))
});

export async function createApproval(projectId: string, formData: FormData) {
  await requireSession();
  const parsed = approvalSchema.safeParse({
    title: formData.get("title"), instructions: formData.get("instructions"),
    fileId: formData.get("fileId"), dueAt: formData.get("dueAt")
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise os campos.");

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.approvals).where(eq(schema.approvals.projectId, projectId));
  const round = count + 1;

  const year = new Date().getFullYear();
  const sequence = await nextSequence("approval", year);
  const code = formatRecordCode("approval", year, sequence);
  const { token, tokenHash } = generatePublicToken();
  const slug = generateSlug(code);

  const [approval] = await db.insert(schema.approvals).values({
    code, projectId, fileId: parsed.data.fileId || null, title: parsed.data.title,
    instructions: parsed.data.instructions || null, round,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    publicSlug: slug, publicTokenHash: tokenHash
  }).returning();

  await recordAuditEvent({ actorType: "user", action: "approval.created", entityType: "approval", entityId: approval.id, after: { code, round } });
  revalidatePath(`/app/operacao/projetos/${projectId}`);
  revalidatePath("/app/operacao/aprovacoes");
  redirect(`/app/operacao/projetos/${projectId}?approval_link_token=${token}&approval_id=${approval.id}`);
}

export async function regenerateApprovalLink(approvalId: string, projectId: string) {
  await requireSession();
  const { token, tokenHash } = generatePublicToken();
  await db.update(schema.approvals).set({ publicTokenHash: tokenHash, updatedAt: new Date() }).where(eq(schema.approvals.id, approvalId));
  await recordAuditEvent({ actorType: "user", action: "approval.link_regenerated", entityType: "approval", entityId: approvalId });
  revalidatePath(`/app/operacao/projetos/${projectId}`);
  redirect(`/app/operacao/projetos/${projectId}?approval_link_token=${token}&approval_id=${approvalId}`);
}

const internalDecisionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome de quem decidiu."),
  comment: z.string().trim().optional().or(z.literal(""))
});

export async function decideApprovalInternally(approvalId: string, projectId: string, decision: "approved" | "changes_requested", formData: FormData) {
  const session = await requireSession();
  const parsed = internalDecisionSchema.safeParse({ name: formData.get("name") || session.user.name, comment: formData.get("comment") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise os campos.");

  await decideApproval(approvalId, decision, { name: parsed.data.name, comment: parsed.data.comment, actor: "user" });
  revalidatePath(`/app/operacao/projetos/${projectId}`);
  revalidatePath("/app/operacao/aprovacoes");
}

export async function listProjectApprovals(projectId: string) {
  await requireSession();
  return db.select().from(schema.approvals).where(eq(schema.approvals.projectId, projectId)).orderBy(desc(schema.approvals.round));
}

export async function listAllApprovals() {
  await requireSession();
  return db.select({ approval: schema.approvals, projectName: schema.projects.name, projectCode: schema.projects.code })
    .from(schema.approvals)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.approvals.projectId))
    .orderBy(desc(schema.approvals.createdAt));
}

// ---------------------------------------------------------------------------
// Horas
// ---------------------------------------------------------------------------

function parseDurationMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

const manualEntrySchema = z.object({
  projectId: z.string().trim().min(1, "Selecione um projeto."),
  description: z.string().trim().min(2, "Descreva a atividade."),
  date: z.string().trim().min(1, "Informe a data."),
  duration: z.string().trim().regex(/^\d{1,3}:\d{2}$/, "Informe a duração no formato HH:MM."),
  billable: z.string().nullish()
});

export async function logTimeEntry(formData: FormData) {
  await requireSession();
  const parsed = manualEntrySchema.safeParse({
    projectId: formData.get("projectId"), description: formData.get("description"),
    date: formData.get("date"), duration: formData.get("duration"), billable: formData.get("billable")
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revise os campos.");

  const minutes = parseDurationMinutes(parsed.data.duration);
  if (minutes <= 0) throw new Error("A duração deve ser maior que zero.");

  const startedAt = new Date(`${parsed.data.date}T09:00:00`);
  const endedAt = new Date(startedAt.getTime() + minutes * 60_000);

  await db.insert(schema.timeEntries).values({
    projectId: parsed.data.projectId, description: parsed.data.description,
    startedAt, endedAt, durationMinutes: minutes, billable: parsed.data.billable === "on"
  });

  revalidatePath("/app/operacao/horas");
  revalidatePath(`/app/operacao/projetos/${parsed.data.projectId}`);
}

const timerSchema = z.object({ projectId: z.string().trim().min(1, "Selecione um projeto."), description: z.string().trim().min(2, "Descreva a atividade.") });

export async function startTimer(formData: FormData): Promise<{ error?: string; entryId?: string }> {
  await requireSession();
  const parsed = timerSchema.safeParse({ projectId: formData.get("projectId"), description: formData.get("description") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos." };

  const [entry] = await db.insert(schema.timeEntries).values({
    projectId: parsed.data.projectId, description: parsed.data.description, startedAt: new Date(), durationMinutes: 0
  }).returning();

  revalidatePath("/app/operacao/horas");
  return { entryId: entry.id };
}

export async function stopTimer(entryId: string) {
  await requireSession();
  const [entry] = await db.select().from(schema.timeEntries).where(eq(schema.timeEntries.id, entryId)).limit(1);
  if (!entry) throw new Error("Lançamento não encontrado.");
  if (entry.endedAt) throw new Error("Este timer já foi encerrado.");

  const endedAt = new Date();
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - new Date(entry.startedAt).getTime()) / 60_000));

  await db.update(schema.timeEntries).set({ endedAt, durationMinutes, updatedAt: new Date() }).where(eq(schema.timeEntries.id, entryId));

  revalidatePath("/app/operacao/horas");
  if (entry.projectId) revalidatePath(`/app/operacao/projetos/${entry.projectId}`);
}

export async function listTimeEntries(projectId?: string) {
  await requireSession();
  return db.select({ entry: schema.timeEntries, projectName: schema.projects.name, projectCode: schema.projects.code })
    .from(schema.timeEntries)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.timeEntries.projectId))
    .where(projectId ? eq(schema.timeEntries.projectId, projectId) : undefined)
    .orderBy(desc(schema.timeEntries.startedAt));
}

export async function getOpenTimer() {
  await requireSession();
  const [entry] = await db.select({ entry: schema.timeEntries, projectName: schema.projects.name })
    .from(schema.timeEntries)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.timeEntries.projectId))
    .where(isNull(schema.timeEntries.endedAt))
    .orderBy(desc(schema.timeEntries.startedAt))
    .limit(1);
  return entry ?? null;
}
