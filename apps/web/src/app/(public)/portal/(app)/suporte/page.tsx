import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { getPortalSession } from "@/lib/portal-auth";
import { getCompanyTickets } from "../data";

const statusLabel: Record<string, string> = { new: "Novo", in_progress: "Em atendimento", waiting_customer: "Aguardando você", resolved: "Resolvido", closed: "Encerrado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { new: "signal", in_progress: "warning", waiting_customer: "warning", resolved: "success", closed: "neutral" };

export default async function PortalSupportPage() {
  const portalUser = await getPortalSession();
  if (!portalUser) return null;
  const tickets = await getCompanyTickets(portalUser.companyId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-[-0.05em]">Suporte</h1>
        <Link href="/portal/suporte/novo" className="primary-button"><Plus className="size-4" />Abrir chamado</Link>
      </div>

      <Card className="mt-6 overflow-hidden">
        {tickets.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">Nenhum chamado aberto ainda.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/portal/suporte/${ticket.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--soft)]">
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--muted)]">{ticket.code}</p>
                  <p className="font-bold">{ticket.title}</p>
                </div>
                <Badge tone={statusTone[ticket.status]}>{statusLabel[ticket.status] ?? ticket.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
