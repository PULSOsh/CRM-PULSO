import { getBriefingByToken } from "./actions";
import { BriefingForm } from "./briefing-form";
import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";

export default async function BriefingPage({
  params, searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  const briefing = token ? await getBriefingByToken(slug, token) : null;

  if (!briefing) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Link inválido ou expirado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Verifique se copiou o link completo. Se o problema continuar, peça um novo link à PULSO.</p>
      </main>
    );
  }

  if (briefing.status === "completed" || briefing.status === "skipped") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{briefing.code}</p>
        <h1 className="mt-3 text-2xl font-extrabold">Briefing já concluído</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Obrigado! Recebemos suas respostas e nossa equipe já está com elas em mãos.</p>
      </main>
    );
  }

  const [opportunity] = await db.select({ title: schema.opportunities.title }).from(schema.opportunities).where(eq(schema.opportunities.id, briefing.opportunityId)).limit(1);

  return (
    <BriefingForm
      briefingId={briefing.id}
      token={token!}
      code={briefing.code}
      title={opportunity?.title ?? "Seu projeto"}
      questions={briefing.questionsSnapshot ?? []}
      initialResponses={(briefing.responses as Record<string, unknown>) ?? {}}
      initialProgress={briefing.progress}
    />
  );
}
