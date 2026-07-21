import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { convertLeadToOpportunity, trashLead, updateLeadStatus, deleteLeadPermanently } from "../actions";
import { Phone, Mail, Trash2 } from "lucide-react";

const statusLabel: Record<string, string> = {
  new: "Novo", contacted: "Contatado", qualifying: "Qualificando",
  qualified: "Qualificado", disqualified: "Desqualificado", converted: "Convertido"
};

const nextActions: Record<string, { status: string; label: string }[]> = {
  new: [{ status: "contacted", label: "Marcar como contatado" }],
  contacted: [{ status: "qualifying", label: "Iniciar qualificação" }],
  qualifying: [{ status: "qualified", label: "Qualificar" }]
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
  if (!lead) notFound();

  const activities = await db.select().from(schema.activities)
    .where(and(eq(schema.activities.entityType, "lead"), eq(schema.activities.entityId, id)))
    .orderBy(desc(schema.activities.occurredAt))
    .limit(20);

  const canDisqualify = lead.status !== "converted" && lead.status !== "disqualified";
  const canConvert = lead.status !== "converted";
  const availableActions = nextActions[lead.status] ?? [];

  const waUrl = lead.phone ? `https://wa.me/55${lead.phone.replace(/\D/g, "")}` : null;

  return (
    <>
      <PageHeader
        eyebrow={lead.code}
        title={lead.name}
        description={lead.companyName ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {canConvert && (
              <form action={convertLeadToOpportunity.bind(null, lead.id)}>
                <button type="submit" className="primary-button">Converter em oportunidade</button>
              </form>
            )}
            <form action={trashLead.bind(null, lead.id)}>
              <button type="submit" className="secondary-button">Mover para lixeira</button>
            </form>
            <form action={deleteLeadPermanently.bind(null, lead.id)}>
              <button type="submit" className="secondary-button !border-red-500/30 !text-red-400 hover:!bg-red-500/10">
                <Trash2 className="size-4" /> Excluir
              </button>
            </form>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Dados de contato</h2>
            <Badge tone={lead.status === "qualified" || lead.status === "converted" ? "success" : lead.status === "disqualified" ? "neutral" : "signal"}>
              {statusLabel[lead.status]}
            </Badge>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold text-[var(--muted)]">Telefone / WhatsApp</dt>
              <dd className="mt-1 font-semibold">
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--signal)] hover:underline">
                    <Phone className="size-3.5" /> {lead.phone}
                  </a>
                ) : (
                  lead.phone || "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-[var(--muted)]">E-mail</dt>
              <dd className="mt-1 font-semibold">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-[var(--signal)] hover:underline">
                    <Mail className="size-3.5" /> {lead.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Serviço de interesse</dt><dd className="mt-1 font-semibold">{lead.service ?? "—"}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Origem</dt><dd className="mt-1 font-semibold">{lead.source ?? "—"}</dd></div>
          </dl>
          {lead.message && (
            <div className="mt-4 rounded-xl bg-[var(--soft)] p-4 text-sm leading-6 whitespace-pre-wrap">{lead.message}</div>
          )}
          {lead.disqualifiedReason && (
            <div className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm">
              <p className="text-xs font-bold text-[var(--muted)]">Motivo da desqualificação</p>
              <p className="mt-1">{lead.disqualifiedReason}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-5">
            {availableActions.map((action) => (
              <form key={action.status} action={updateLeadStatus.bind(null, lead.id, action.status as never, undefined)}>
                <button type="submit" className="secondary-button">{action.label}</button>
              </form>
            ))}
            {canDisqualify && (
              <details className="inline-block">
                <summary className="secondary-button inline-flex cursor-pointer list-none">Desqualificar</summary>
                <form action={async (formData: FormData) => {
                  "use server";
                  await updateLeadStatus(lead.id, "disqualified", String(formData.get("reason") ?? ""));
                }} className="mt-2 flex gap-2">
                  <input name="reason" placeholder="Motivo" required className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
                  <button type="submit" className="secondary-button">Confirmar</button>
                </form>
              </details>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Histórico</h2>
          {activities.length === 0 ? (
            <p className="mt-4 text-xs text-[var(--muted)]">Nenhuma atividade registrada ainda.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="border-l-2 border-[var(--signal)] pl-3 text-xs">
                  <p className="font-bold text-[var(--text)]">{a.summary || a.type}</p>
                  <p className="text-[10px] text-[var(--muted)]">{new Date(a.occurredAt).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
