import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listTickets } from "./actions";

const statusLabel: Record<string, string> = { new: "Novo", in_progress: "Em atendimento", waiting_customer: "Aguardando cliente", resolved: "Resolvido", closed: "Encerrado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { new: "signal", in_progress: "warning", waiting_customer: "warning", resolved: "success", closed: "neutral" };

export default async function SupportPage() {
  const tickets = await listTickets();

  return (
    <>
      <PageHeader eyebrow="Operação" title="Suporte" description="Chamados abertos pelo portal do cliente ou registrados internamente."
        actions={<Link href="/app/operacao/suporte/novo" className="primary-button"><Plus className="size-4" />Novo chamado</Link>} />

      <Card className="overflow-hidden">
        {tickets.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">Nenhum chamado ainda.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {tickets.map(({ ticket, companyName }) => (
              <Link key={ticket.id} href={`/app/operacao/suporte/${ticket.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--soft)]">
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--muted)]">{ticket.code}</p>
                  <p className="font-bold">{ticket.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{companyName ?? "Sem empresa vinculada"}</p>
                </div>
                <Badge tone={statusTone[ticket.status]}>{statusLabel[ticket.status] ?? ticket.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
