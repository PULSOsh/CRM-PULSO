import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listContracts } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", signed: "Assinado", cancelled: "Cancelado"
};
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = {
  draft: "neutral", sent: "signal", signed: "success", cancelled: "neutral"
};

export default async function ContractsPage() {
  const rows = await listContracts();

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Contratos"
        description="Geração a partir da proposta aceita, revisão administrativa e assinatura com evidências."
        actions={<Link href="/app/comercial/contratos/novo" className="primary-button"><Plus className="size-4" />Novo contrato</Link>}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Oportunidade</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum contrato criado ainda.</td></tr>}
              {rows.map(({ contract, opportunityTitle }) => (
                <tr key={contract.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{contract.code}</td>
                  <td className="px-5 py-4 font-bold"><Link href={`/app/comercial/contratos/${contract.id}`} className="hover:underline">{opportunityTitle}</Link></td>
                  <td className="px-5 py-4"><Badge tone={statusTone[contract.status]}>{statusLabel[contract.status] ?? contract.status}</Badge></td>
                  <td className="px-5 py-4"><Link href={`/app/comercial/contratos/${contract.id}`} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Ver detalhes</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
