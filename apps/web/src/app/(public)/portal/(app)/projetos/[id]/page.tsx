import { notFound } from "next/navigation";
import { Badge, Card } from "@pulso/ui";
import { getPortalSession } from "@/lib/portal-auth";
import { getAccessibleProject, getClientApprovals, getClientFiles } from "../../data";
import { PortalApprovalDecision } from "./decision-form";

const statusLabel: Record<string, string> = { planned: "Planejado", active: "Ativo", waiting: "Aguardando", completed: "Concluído", cancelled: "Cancelado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { planned: "neutral", active: "signal", waiting: "warning", completed: "success", cancelled: "neutral" };
const approvalStatusLabel: Record<string, string> = { pending: "Aguardando sua decisão", approved: "Aprovado", changes_requested: "Alterações solicitadas" };
const approvalStatusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { pending: "signal", approved: "success", changes_requested: "warning" };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portalUser = await getPortalSession();
  if (!portalUser) return null;

  const project = await getAccessibleProject(portalUser.id, id);
  if (!project) notFound();

  const [approvals, files] = await Promise.all([getClientApprovals(id), getClientFiles(id)]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{project.code}</p>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-[-0.05em]">{project.name}</h1>
        <Badge tone={statusTone[project.status]}>{statusLabel[project.status] ?? project.status}</Badge>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-extrabold">Aprovações</h2>
          <div className="mt-4 space-y-3">
            {approvals.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma aprovação ainda.</p>}
            {approvals.map((approval) => (
              <div key={approval.id} className="rounded-xl border border-[var(--line)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{approval.title}</p>
                  <Badge tone={approvalStatusTone[approval.status]}>{approvalStatusLabel[approval.status] ?? approval.status}</Badge>
                </div>
                {approval.instructions && <p className="mt-1 text-xs text-[var(--muted)]">{approval.instructions}</p>}
                {approval.status === "pending" && <PortalApprovalDecision approvalId={approval.id} projectId={id} />}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Arquivos</h2>
          <div className="mt-4 space-y-2">
            {files.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum arquivo compartilhado ainda.</p>}
            {files.map((file) => (
              <a key={file.id} href={`/api/files/${file.id}`} target="_blank" rel="noreferrer" className="block rounded-xl border border-[var(--line)] p-3 hover:bg-[var(--soft)]">
                <p className="truncate text-sm font-bold hover:underline">{file.originalName}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{formatSize(file.sizeBytes)}</p>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
