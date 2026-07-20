import { notFound } from "next/navigation";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { getTicket, updateTicketStatus } from "../actions";
import { InternalReplyForm } from "./reply-form";

const statusLabel: Record<string, string> = { new: "Novo", in_progress: "Em atendimento", waiting_customer: "Aguardando cliente", resolved: "Resolvido", closed: "Encerrado" };
const statusOptions = [
  { value: "new", label: "Novo" }, { value: "in_progress", label: "Em atendimento" }, { value: "waiting_customer", label: "Aguardando cliente" },
  { value: "resolved", label: "Resolvido" }, { value: "closed", label: "Encerrado" }
];

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTicket(id);
  if (!result) notFound();
  const { ticket, companyName, messages } = result;

  return (
    <>
      <PageHeader eyebrow={ticket.code} title={ticket.title} description={companyName ?? "Sem empresa vinculada"} />

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Card className="p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-xl border p-4 ${message.visibility === "internal" ? "border-[var(--warning)] bg-[color:var(--warning)/.06]" : "border-[var(--line)] bg-[var(--soft)]"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">{message.authorName} {message.visibility === "internal" && <Badge tone="warning">Nota interna</Badge>}</p>
                  <p className="text-xs text-[var(--muted)]">{new Date(message.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
              </div>
            ))}
          </div>
          <InternalReplyForm ticketId={ticket.id} />
        </Card>

        <Card className="h-fit p-5">
          <h2 className="font-extrabold">Status</h2>
          <form action={updateTicketStatus.bind(null, ticket.id)} className="mt-3 flex flex-col gap-2">
            <select name="status" defaultValue={ticket.status} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]">
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button type="submit" className="secondary-button w-full justify-center text-xs">Atualizar status</button>
          </form>
          <p className="mt-3 text-xs text-[var(--muted)]">Atual: {statusLabel[ticket.status] ?? ticket.status}</p>
        </Card>
      </div>
    </>
  );
}
