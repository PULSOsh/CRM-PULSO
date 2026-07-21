import { Send } from "lucide-react";
import { db, schema } from "@pulso/database";
import { Badge, Card } from "@pulso/ui";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { addSignatory, cancelContract, removeSignatory, reviewAndSend } from "./../actions";
import { ClausesEditor } from "./clauses-editor";
import { InternalSignForm } from "./sign-form";
import { UploadSignedDocument } from "./upload-signed";
import { LinkBox, RegenerateContractLink } from "./send-and-link";

const statusLabel: Record<string, string> = { draft: "Rascunho", sent: "Enviado", signed: "Assinado", cancelled: "Cancelado" };

export default async function ContractDetailPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ link_token?: string }>;
}) {
  const { id } = await params;
  const { link_token } = await searchParams;

  const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, id)).limit(1);
  if (!contract) notFound();

  const [opportunity, signatories] = await Promise.all([
    db.select({ title: schema.opportunities.title }).from(schema.opportunities).where(eq(schema.opportunities.id, contract.opportunityId)).limit(1).then((r) => r[0]),
    db.select().from(schema.contractSignatories).where(eq(schema.contractSignatories.contractId, id)).orderBy(asc(schema.contractSignatories.position))
  ]);

  const signedFile = contract.signedFileId
    ? await db.select().from(schema.files).where(eq(schema.files.id, contract.signedFileId)).limit(1).then((r) => r[0])
    : null;

  const content = contract.content as { clauses: string; scopeSummary: string; totalValue: number; paymentSummary: string };
  const isDraft = contract.status === "draft";
  const isSent = contract.status === "sent";
  const pendingSignatory = signatories.find((s) => s.status !== "signed");
  const freshLink = link_token && contract.publicSlug ? `/contrato/${contract.publicSlug}?token=${link_token}` : null;

  return (
    <>
      <PageHeader
        eyebrow={contract.code}
        title={opportunity?.title ?? "Contrato"}
        actions={
          contract.status !== "signed" && contract.status !== "cancelled" ? (
            <details className="inline-block">
              <summary className="secondary-button inline-flex cursor-pointer list-none">Cancelar contrato</summary>
              <form action={cancelContract.bind(null, contract.id)} className="mt-2 flex gap-2">
                <input name="reason" placeholder="Motivo do cancelamento" required className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
                <button type="submit" className="secondary-button">Confirmar</button>
              </form>
            </details>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold">Cláusulas</h2>
            <Badge tone={contract.status === "signed" ? "success" : contract.status === "cancelled" ? "neutral" : "signal"}>{statusLabel[contract.status] ?? contract.status}</Badge>
          </div>

          {isDraft ? (
            <ClausesEditor contractId={contract.id} initialClauses={content.clauses} initialType={(content as any).type ?? "avulso"} />
          ) : (
            <pre className="whitespace-pre-wrap rounded-xl bg-[var(--soft)] p-4 font-mono text-xs leading-6">{content.clauses}</pre>
          )}

          {contract.status === "cancelled" && contract.cancelReason && (
            <div className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm">
              <p className="text-xs font-bold text-[var(--muted)]">Motivo do cancelamento</p>
              <p className="mt-1">{contract.cancelReason}</p>
            </div>
          )}

          {contract.status === "signed" && (
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm">
              <p className="font-extrabold text-[var(--signal)]">Contrato assinado</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{contract.signedAt && new Date(contract.signedAt).toLocaleString("pt-BR")} · hash {contract.documentHash?.slice(0, 16)}…</p>
              {signedFile && <a href={`/api/files/${signedFile.id}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-[var(--signal)] hover:underline">Ver documento enviado ({signedFile.originalName})</a>}
            </div>
          )}

          {isDraft && (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <form action={reviewAndSend.bind(null, contract.id)}>
                <button type="submit" disabled={signatories.length === 0} className="primary-button">
                  <Send className="size-4" />Revisar e enviar para assinatura
                </button>
              </form>
              {signatories.length === 0 && <p className="mt-2 text-xs text-[var(--muted)]">Adicione ao menos um signatário antes de enviar.</p>}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {freshLink && (
            <Card className="p-6">
              <p className="mb-2 text-xs font-bold text-[var(--signal)]">Link gerado agora — copie, não será mostrado de novo</p>
              <LinkBox link={freshLink} />
            </Card>
          )}
          <Card className="p-6">
            <h2 className="font-extrabold">Signatários</h2>
            <div className="mt-4 space-y-3">
              {signatories.map((s) => (
                <div key={s.id} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{s.name} <span className="text-xs font-normal text-[var(--muted)]">({s.role === "pulso" ? "PULSO" : "Cliente"})</span></p>
                    <Badge tone={s.status === "signed" ? "success" : "neutral"}>{s.status === "signed" ? "Assinado" : "Pendente"}</Badge>
                  </div>
                  {isDraft && s.role !== "pulso" && (
                    <form action={removeSignatory.bind(null, contract.id, s.id)} className="mt-2">
                      <button type="submit" className="text-xs font-bold text-[var(--muted)] hover:text-[#b3261e]">Remover</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
            {isDraft && (
              <form action={addSignatory.bind(null, contract.id)} className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
                <input name="name" placeholder="Nome do signatário" required className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
                <input name="email" placeholder="E-mail (opcional)" className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
                <button type="submit" className="secondary-button w-full justify-center text-xs">Adicionar signatário</button>
              </form>
            )}
          </Card>

          {isSent && pendingSignatory?.role === "pulso" && (
            <InternalSignForm contractId={contract.id} signatoryId={pendingSignatory.id} defaultName={pendingSignatory.name} />
          )}

          {isSent && (
            <Card className="p-6">
              <h2 className="font-extrabold">Assinatura externa</h2>
              <p className="mt-2 text-xs text-[var(--muted)]">Assinado fora do sistema (papel, outro provedor)? Envie o documento assinado aqui.</p>
              <div className="mt-3"><UploadSignedDocument contractId={contract.id} /></div>
              <div className="mt-4 border-t border-[var(--line)] pt-4">
                <p className="mb-2 text-xs font-bold text-[var(--muted-strong)]">Link de assinatura perdido?</p>
                <RegenerateContractLink contractId={contract.id} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
