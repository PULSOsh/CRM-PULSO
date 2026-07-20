import { getContractByToken } from "./actions";
import { ClientSignForm } from "./sign-form";

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
        <h1 className="text-2xl font-extrabold">Link inválido ou expirado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Verifique se copiou o link completo. Se o problema continuar, peça um novo link à PULSO.</p>
      </main>
    );
  }

  const { contract, signatories } = result;
  const content = contract.content as { clauses: string; totalValue: number };

  if (contract.status === "cancelled") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Contrato cancelado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Este contrato não está mais disponível para assinatura.</p>
      </main>
    );
  }

  if (contract.status === "signed") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{contract.code}</p>
        <h1 className="mt-3 text-2xl font-extrabold">Contrato totalmente assinado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Todas as partes já assinaram este contrato. Obrigado!</p>
      </main>
    );
  }

  const pendingClientSignatory = signatories.find((s) => s.role !== "pulso" && s.status !== "signed");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{contract.code}</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] md:text-4xl">Contrato de prestação de serviços</h1>
      <p className="money-value mt-2 text-lg font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(content.totalValue)}</p>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-6">{content.clauses}</pre>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-extrabold text-[var(--muted-strong)]">Signatários</h2>
        <div className="space-y-2">
          {signatories.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3 text-sm">
              <span className="font-bold">{s.name} <span className="font-normal text-[var(--muted)]">({s.role === "pulso" ? "PULSO" : "Cliente"})</span></span>
              <span className={`text-xs font-bold ${s.status === "signed" ? "text-[var(--signal)]" : "text-[var(--muted)]"}`}>{s.status === "signed" ? "Assinado" : "Pendente"}</span>
            </div>
          ))}
        </div>
      </div>

      {pendingClientSignatory ? (
        <div className="mt-6">
          <ClientSignForm contractId={contract.id} signatoryId={pendingClientSignatory.id} token={token!} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">Aguardando assinatura da PULSO para finalizar.</p>
      )}
    </main>
  );
}
