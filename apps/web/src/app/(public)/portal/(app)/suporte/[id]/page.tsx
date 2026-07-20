import { notFound } from "next/navigation";
import { Badge, Card } from "@pulso/ui";
import { getPortalSession } from "@/lib/portal-auth";
import { getTicketForCompany } from "../../data";
import { ReplyForm } from "./reply-form";

const statusLabel: Record<string, string> = { new: "Novo", in_progress: "Em atendimento", waiting_customer: "Aguardando você", resolved: "Resolvido", closed: "Encerrado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { new: "signal", in_progress: "warning", waiting_customer: "warning", resolved: "success", closed: "neutral" };

export default async function PortalTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portalUser = await getPortalSession();
  if (!portalUser) return null;

  const result = await getTicketForCompany(id, portalUser.companyId);
  if (!result) notFound();
  const { ticket, messages } = result;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{ticket.code}</p>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-[-0.05em]">{ticket.title}</h1>
        <Badge tone={statusTone[ticket.status]}>{statusLabel[ticket.status] ?? ticket.status}</Badge>
      </div>

      <Card className="mt-6 p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`rounded-xl border border-[var(--line)] p-4 ${message.authorType === "portal_user" ? "bg-[var(--soft)]" : "bg-[var(--surface)]"}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{message.authorName}</p>
                <p className="text-xs text-[var(--muted)]">{new Date(message.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
            </div>
          ))}
        </div>
        <ReplyForm ticketId={ticket.id} />
      </Card>
    </main>
  );
}
