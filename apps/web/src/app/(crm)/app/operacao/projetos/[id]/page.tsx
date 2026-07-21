import { Badge, Card } from "@pulso/ui";
import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createApproval, listFiles, listProjectApprovals, listProjectTasks, listTimeEntries, regenerateApprovalLink } from "../actions";
import { ProjectStatusForm } from "./status-form";
import { TaskPanel } from "./task-panel";
import { FilePanel } from "./file-panel";
import { ApprovalDecisionInline } from "./approval-decision";
import { LinkBox } from "./link-box";

const statusLabel: Record<string, string> = { planned: "Planejado", active: "Ativo", waiting: "Aguardando", completed: "Concluído", cancelled: "Cancelado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { planned: "neutral", active: "signal", waiting: "warning", completed: "success", cancelled: "neutral" };
const approvalStatusLabel: Record<string, string> = { pending: "Aguardando decisão", approved: "Aprovado", changes_requested: "Alterações solicitadas" };
const approvalStatusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { pending: "signal", approved: "success", changes_requested: "warning" };
const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

import { DeleteProjectButton } from "./delete-project-button";

export default async function ProjectDetailPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ approval_link_token?: string; approval_id?: string }>;
}) {
  const { id } = await params;
  const { approval_link_token, approval_id } = await searchParams;

  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  if (!project) notFound();

  const [tasks, files, approvals, timeEntries] = await Promise.all([
    listProjectTasks(id),
    listFiles({ entityType: "project", entityId: id }),
    listProjectApprovals(id),
    listTimeEntries(id)
  ]);

  const totalMinutes = timeEntries.reduce((sum, { entry }) => sum + entry.durationMinutes, 0);
  const realizedHours = totalMinutes / 60;
  const estimatedHours = Number(project.estimatedHours);

  const freshApproval = approval_link_token && approval_id ? approvals.find((a) => a.id === approval_id) : null;
  const freshLink = freshApproval ? `/aprovacao/${freshApproval.publicSlug}?token=${approval_link_token}` : null;

  return (
    <>
      <PageHeader
        eyebrow={project.code}
        title={project.name}
        description={`Orçamento ${currency(Number(project.budget))} · ${estimatedHours}h estimadas`}
        actions={<DeleteProjectButton projectId={project.id} projectName={project.name} />}
      />

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge tone={statusTone[project.status]}>{statusLabel[project.status] ?? project.status}</Badge>
            {project.deliveredAt && <span className="text-xs text-[var(--muted)]">Entregue em {new Date(project.deliveredAt).toLocaleDateString("pt-BR")}</span>}
            {project.warrantyEndsAt && <span className="text-xs text-[var(--muted)]">Garantia até {new Date(project.warrantyEndsAt).toLocaleDateString("pt-BR")}</span>}
          </div>
          <ProjectStatusForm projectId={project.id} currentStatus={project.status} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-extrabold">Tarefas</h2>
          <div className="mt-4"><TaskPanel projectId={project.id} tasks={tasks} /></div>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Arquivos</h2>
          <div className="mt-4"><FilePanel projectId={project.id} files={files} /></div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Horas</h2>
            <span className="text-xs text-[var(--muted)]">{realizedHours.toFixed(1)}h realizadas{estimatedHours > 0 && ` de ${estimatedHours}h estimadas`}</span>
          </div>
          {estimatedHours > 0 && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--soft)]">
              <div className={`h-full rounded-full ${realizedHours > estimatedHours ? "bg-[var(--error)]" : "bg-[var(--signal)]"}`} style={{ width: `${Math.min(100, (realizedHours / estimatedHours) * 100)}%` }} />
            </div>
          )}
          <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
            {timeEntries.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum lançamento ainda.</p>}
            {timeEntries.map(({ entry }) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3 text-sm">
                <div><p className="font-bold">{entry.description}</p><p className="text-xs text-[var(--muted)]">{new Date(entry.startedAt).toLocaleDateString("pt-BR")}</p></div>
                <span className="font-mono text-xs font-bold">{(entry.durationMinutes / 60).toFixed(1)}h</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">Lançamentos manuais e timer disponíveis em <a href="/app/operacao/horas" className="font-bold text-[var(--signal)] hover:underline">Controle de horas</a>.</p>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Aprovações</h2>

          {freshLink && (
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
              <p className="mb-2 text-xs font-bold text-[var(--signal)]">Link gerado agora — copie, não será mostrado de novo</p>
              <LinkBox link={freshLink} />
            </div>
          )}

          <div className="mt-4 space-y-3">
            {approvals.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma aprovação criada ainda.</p>}
            {approvals.map((approval) => (
              <div key={approval.id} className="rounded-xl border border-[var(--line)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{approval.title} <span className="text-xs font-normal text-[var(--muted)]">rodada {approval.round}</span></p>
                  <Badge tone={approvalStatusTone[approval.status]}>{approvalStatusLabel[approval.status] ?? approval.status}</Badge>
                </div>
                {approval.status === "changes_requested" && approval.decisionComment && (
                  <p className="mt-2 text-xs text-[var(--muted)]">{approval.decisionComment}</p>
                )}
                {approval.status === "pending" && (
                  <div className="mt-3 space-y-2">
                    <ApprovalDecisionInline approvalId={approval.id} projectId={project.id} />
                    <form action={regenerateApprovalLink.bind(null, approval.id, project.id)}>
                      <button type="submit" className="text-xs font-bold text-[var(--muted)] hover:text-[var(--signal)]">Regenerar link do cliente</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form action={createApproval.bind(null, project.id)} className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
            <input name="title" placeholder="Título da aprovação (ex.: Layout inicial)" required className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
            <textarea name="instructions" placeholder="Instruções para o cliente (opcional)" rows={2} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
            <div className="flex gap-2">
              <select name="fileId" defaultValue="" className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]">
                <option value="">Sem arquivo vinculado</option>
                {files.map((f) => <option key={f.id} value={f.id}>{f.originalName}</option>)}
              </select>
              <input name="dueAt" type="date" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <button type="submit" className="secondary-button w-full justify-center text-xs">Criar aprovação e gerar link</button>
          </form>
        </Card>
      </div>
    </>
  );
}
