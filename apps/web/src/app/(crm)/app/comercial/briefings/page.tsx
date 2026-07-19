import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listBriefings } from "./actions";

const statusLabel: Record<string, string> = {
  draft: "Rascunho", sent: "Enviado", started: "Iniciado", completed: "Concluído",
  analyzed: "Analisado", skipped: "Pulado", archived: "Arquivado"
};
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = {
  draft: "neutral", sent: "signal", started: "warning", completed: "success",
  analyzed: "success", skipped: "neutral", archived: "neutral"
};

export default async function BriefingsPage() {
  const rows = await listBriefings();

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Briefings"
        description="Sites públicos seguros, respostas versionadas e diagnóstico do projeto."
        actions={<Link href="/app/comercial/briefings/novo" className="primary-button"><Plus className="size-4" />Novo briefing</Link>}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Oportunidade</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Progresso</th><th className="px-5 py-4" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum briefing enviado ainda.</td></tr>}
              {rows.map(({ briefing, opportunityTitle }) => (
                <tr key={briefing.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{briefing.code}</td>
                  <td className="px-5 py-4 font-bold"><Link href={`/app/comercial/briefings/${briefing.id}`} className="hover:underline">{opportunityTitle}</Link></td>
                  <td className="px-5 py-4"><Badge tone={statusTone[briefing.status]}>{statusLabel[briefing.status] ?? briefing.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{briefing.status === "skipped" ? "—" : `${briefing.progress}%`}</td>
                  <td className="px-5 py-4"><Link href={`/app/comercial/briefings/${briefing.id}`} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Ver detalhes</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
