import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";
import { getProposalByToken, trackView } from "./actions";
import { ProposalView } from "./proposal-view";

export default async function ProposalPage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  const result = token ? await getProposalByToken(slug, token) : null;

  if (!result) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Link inválido ou expirado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Verifique se copiou o link completo. Se o problema continuar, peça um novo link à PULSO.</p>
      </main>
    );
  }

  const { proposal, version, expired } = result;

  if (proposal.status === "accepted") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{proposal.code}</p>
        <h1 className="mt-3 text-2xl font-extrabold">Proposta já aceita</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Obrigado! Aceita em {proposal.acceptedAt && new Date(proposal.acceptedAt).toLocaleString("pt-BR")} por {proposal.acceptorName}.</p>
      </main>
    );
  }
  if (proposal.status === "rejected") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Proposta recusada</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Esta proposta foi recusada anteriormente. Fale com a PULSO se quiser revisitar.</p>
      </main>
    );
  }
  if (expired) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Proposta expirada</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">O prazo de validade desta proposta terminou. Entre em contato para uma atualização.</p>
      </main>
    );
  }

  await trackView(proposal.id, version.id);

  const [opportunity] = await db.select({ title: schema.opportunities.title }).from(schema.opportunities).where(eq(schema.opportunities.id, proposal.opportunityId)).limit(1);

  return <ProposalView proposal={proposal} version={version} token={token!} opportunityTitle={opportunity?.title ?? "seu projeto"} />;
}
