import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { createNewVersion, publishVersion, resolveChangeRequest } from "../actions";
import { ProposalEditor } from "./editor";
import { RegenerateProposalLink } from "./regenerate-link";

const statusLabel: Record<string, string> = {
  draft: "Rascunho", sent: "Enviada", accepted: "Aceita", rejected: "Rejeitada"
};

export default async function ProposalDetailPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ link_token?: string }>;
}) {
  const { id } = await params;
  const { link_token } = await searchParams;

  const [proposal] = await db.select().from(schema.proposals).where(eq(schema.proposals.id, id)).limit(1);
  if (!proposal) notFound();

  const [opportunity, versions, changeRequests] = await Promise.all([
    db.select({ title: schema.opportunities.title }).from(schema.opportunities).where(eq(schema.opportunities.id, proposal.opportunityId)).limit(1).then((r) => r[0]),
    db.select().from(schema.proposalVersions).where(eq(schema.proposalVersions.proposalId, id)).orderBy(desc(schema.proposalVersions.version)),
    db.select().from(schema.proposalChangeRequests).where(eq(schema.proposalChangeRequests.proposalId, id)).orderBy(desc(schema.proposalChangeRequests.createdAt))
  ]);

  const draftVersion = versions.find((v) => !v.publishedAt);
  const publishedVersion = versions.find((v) => v.publishedAt);
  const freshLink = link_token ? `/proposta/${proposal.publicSlug}?token=${link_token}` : null;

  return (
    <>
      <PageHeader
        eyebrow={proposal.code}
        title={opportunity?.title ?? "Proposta"}
        actions={
          <>
            {publishedVersion && !draftVersion && (
              <form action={createNewVersion.bind(null, proposal.id)}>
                <button type="submit" className="secondary-button">Criar nova versão</button>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold">{draftVersion ? `Editando versão ${draftVersion.version}` : `Versão ${publishedVersion?.version} publicada`}</h2>
            <Badge tone={proposal.status === "accepted" ? "success" : proposal.status === "rejected" ? "neutral" : "signal"}>{statusLabel[proposal.status] ?? proposal.status}</Badge>
          </div>

          {draftVersion ? (
            <ProposalEditor proposalId={proposal.id} versionId={draftVersion.id} initialContent={draftVersion.content} initialValidUntil={proposal.validUntil} />
          ) : publishedVersion ? (
            <div className="space-y-4 text-sm">
              <p className="leading-6">{publishedVersion.content.intro}</p>
              <div>
                <p className="text-xs font-bold text-[var(--muted)]">Itens de escopo</p>
                <ul className="mt-2 space-y-1">
                  {publishedVersion.content.scopeItems.map((item) => (
                    <li key={item.id} className="flex justify-between"><span>{item.label}</span><span className="money-value font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price)}</span></li>
                  ))}
                </ul>
              </div>
              <p className="font-bold">Total: <span className="money-value">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(publishedVersion.total))}</span></p>
              <p className="text-xs text-[var(--muted)]">{publishedVersion.viewCount} visualizações</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Nenhuma versão encontrada.</p>
          )}

          {proposal.status === "accepted" && (
            <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm">
              <p className="font-extrabold text-[var(--signal)]">Aceita por {proposal.acceptorName}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {proposal.acceptedAt && new Date(proposal.acceptedAt).toLocaleString("pt-BR")} · IP {proposal.acceptorIp ?? "—"}
              </p>
              {proposal.acceptorDocument && <p className="mt-1 text-xs text-[var(--muted)]">Documento: {proposal.acceptorDocument}</p>}
            </div>
          )}
          {proposal.status === "rejected" && proposal.rejectionReason && (
            <div className="mt-6 rounded-xl border border-[var(--line)] p-4 text-sm">
              <p className="text-xs font-bold text-[var(--muted)]">Motivo da rejeição</p>
              <p className="mt-1">{proposal.rejectionReason}</p>
            </div>
          )}

          {changeRequests.length > 0 && (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <h3 className="mb-3 font-extrabold">Pedidos de condição alternativa</h3>
              <div className="space-y-3">
                {changeRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-[var(--line)] p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{req.requestedPaymentLabel} · {req.requestedInstallments}x</p>
                      <Badge tone={req.status === "pending" ? "warning" : req.status === "approved" ? "success" : "neutral"}>{req.status}</Badge>
                    </div>
                    {req.comment && <p className="mt-1 text-xs text-[var(--muted)]">{req.comment}</p>}
                    {req.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <form action={resolveChangeRequest.bind(null, req.id, "approved", "")}><button type="submit" className="secondary-button px-3 py-1.5 text-xs">Aprovar</button></form>
                        <form action={resolveChangeRequest.bind(null, req.id, "rejected", "")}><button type="submit" className="secondary-button px-3 py-1.5 text-xs">Rejeitar</button></form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Compartilhamento</h2>
          {freshLink ? (
            <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
              <p className="mb-2 text-xs font-bold text-[var(--signal)]">Link gerado agora — copie, não será mostrado de novo</p>
              <input readOnly value={typeof window === "undefined" ? freshLink : `${window.location.origin}${freshLink}`} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs outline-none" />
            </div>
          ) : (
            <div className="mt-3">
              <RegenerateProposalLink proposalId={proposal.id} />
            </div>
          )}
          <dl className="mt-6 space-y-3 text-sm">
            <div><dt className="text-xs font-bold text-[var(--muted)]">Válida até</dt><dd className="mt-1 font-semibold">{proposal.validUntil ?? "Sem prazo definido"}</dd></div>
            <div><dt className="text-xs font-bold text-[var(--muted)]">Versões</dt><dd className="mt-1 font-semibold">{versions.length}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  );
}
