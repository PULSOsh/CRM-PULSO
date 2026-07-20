import { getApprovalByToken } from "./actions";
import { ApprovalDecisionForm } from "./decision-form";

export default async function ApprovalPage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  const result = token ? await getApprovalByToken(slug, token) : null;

  if (!result) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Link inválido ou expirado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Verifique se copiou o link completo. Se o problema continuar, peça um novo link à PULSO.</p>
      </main>
    );
  }

  const { approval, project, file } = result;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{approval.code} · rodada {approval.round}</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] md:text-4xl">{approval.title}</h1>
      {project && <p className="mt-2 text-sm text-[var(--muted)]">Projeto: {project.name}</p>}
      {approval.instructions && <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{approval.instructions}</p>}

      {file && (
        <a
          href={`/api/public/aprovacoes/${slug}?token=${token}`}
          target="_blank" rel="noreferrer"
          className="secondary-button mt-5 inline-flex"
        >
          Ver arquivo enviado ({file.originalName})
        </a>
      )}

      <div className="mt-8">
        {approval.status === "pending" && <ApprovalDecisionForm approvalId={approval.id} slug={slug} token={token!} />}

        {approval.status === "approved" && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="font-extrabold text-[var(--success)]">Aprovado</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Decidido por {approval.decidedByName} em {approval.decidedAt && new Date(approval.decidedAt).toLocaleString("pt-BR")}.</p>
          </div>
        )}

        {approval.status === "changes_requested" && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="font-extrabold text-[var(--warning)]">Alterações solicitadas</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Decidido por {approval.decidedByName} em {approval.decidedAt && new Date(approval.decidedAt).toLocaleString("pt-BR")}.</p>
            {approval.decisionComment && <p className="mt-3 text-sm leading-6">{approval.decisionComment}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
