import { getContractByToken } from "./actions";
import { ClientSignForm } from "./sign-form";
import { ContractDocument } from "@/components/contract-document";

export default async function ContractPage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  const result = token ? await getContractByToken(slug, token) : null;

  if (!result) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Link inválido ou expirado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Verifique se copiou o link completo. Se o problema continuar, peça um novo link à PULSO.</p>
      </main>
    );
  }

  const { contract, signatories } = result;
  const content = contract.content as { clauses: string; totalValue: number; paymentSummary?: string };

  if (contract.status === "cancelled") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-red-500">Contrato cancelado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Este contrato foi cancelado e não está mais disponível para assinatura.</p>
      </main>
    );
  }

  const pendingClientSignatory = signatories.find((s) => s.role !== "pulso" && s.status !== "signed");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-14 space-y-8">
      <ContractDocument
        code={contract.code}
        clauses={content.clauses}
        totalValue={content.totalValue}
        paymentSummary={content.paymentSummary}
        status={contract.status}
        signatories={signatories}
        documentHash={contract.documentHash}
        signedAt={contract.signedAt}
      />

      {pendingClientSignatory ? (
        <div className="mx-auto max-w-2xl mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
          <h3 className="font-extrabold text-base text-[var(--text)] mb-1">Assinatura do Contratante</h3>
          <p className="text-xs text-[var(--muted)] mb-4">Confirme seus dados para assinar digitalmente este contrato.</p>
          <ClientSignForm contractId={contract.id} signatoryId={pendingClientSignatory.id} token={token!} />
        </div>
      ) : contract.status === "signed" ? (
        <div className="text-center py-6 text-sm font-extrabold text-emerald-400">
          ✓ Contrato totalmente assinado por todas as partes.
        </div>
      ) : (
        <p className="text-center text-sm text-[var(--muted)]">Aguardando assinatura da PULSO para finalizar.</p>
      )}
    </main>
  );
}
