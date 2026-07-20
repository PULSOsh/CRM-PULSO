import Link from "next/link";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listAllApprovals } from "../projetos/actions";

const statusLabel: Record<string, string> = { pending: "Aguardando decisão", approved: "Aprovado", changes_requested: "Alterações solicitadas" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { pending: "signal", approved: "success", changes_requested: "warning" };

export default async function ApprovalsPage() {
  const approvals = await listAllApprovals();

  return (
    <>
      <PageHeader eyebrow="Operação" title="Aprovações" description="Controle entregas, rodadas e decisões formais do cliente." />
      <Card className="overflow-hidden">
        {approvals.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">Nenhuma aprovação criada ainda. Crie uma a partir da página do projeto.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {approvals.map(({ approval, projectName, projectCode }) => (
              <Link key={approval.id} href={`/app/operacao/projetos/${approval.projectId}`} className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--soft)]">
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--muted)]">{approval.code} · rodada {approval.round}</p>
                  <p className="font-bold">{approval.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{projectCode} — {projectName}</p>
                </div>
                <Badge tone={statusTone[approval.status]}>{statusLabel[approval.status] ?? approval.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
