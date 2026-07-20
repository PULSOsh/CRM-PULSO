import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listProposals } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Rascunho", sent: "Enviada", accepted: "Aceita", rejected: "Rejeitada"
};
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = {
  draft: "neutral", sent: "signal", accepted: "success", rejected: "neutral"
};

export default async function ProposalsPage() {
  const rows = await listProposals();

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Propostas"
        description="Propostas web interativas, versões imutáveis e aceite registrado."
        actions={<Link href="/app/comercial/propostas/novo" className="primary-button"><Plus className="size-4" />Nova proposta</Link>}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Oportunidade</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhuma proposta criada ainda.</td></tr>}
              {rows.map(({ proposal, opportunityTitle }) => (
                <tr key={proposal.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{proposal.code}</td>
                  <td className="px-5 py-4 font-bold"><Link href={`/app/comercial/propostas/${proposal.id}`} className="hover:underline">{opportunityTitle}</Link></td>
                  <td className="px-5 py-4"><Badge tone={statusTone[proposal.status]}>{statusLabel[proposal.status] ?? proposal.status}</Badge></td>
                  <td className="px-5 py-4"><Link href={`/app/comercial/propostas/${proposal.id}`} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Ver detalhes</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
