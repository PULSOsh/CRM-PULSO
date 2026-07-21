import { PageHeader } from "@/components/page-header";
import { Plus, ExternalLink, Activity, Users, ClipboardCheck } from "lucide-react";
import { Badge, Card, Button } from "@pulso/ui";
import { db, schema } from "@pulso/database";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function FormulariosPage() {
  const briefings = await db.select({
    id: schema.briefings.id,
    code: schema.briefings.code,
    publicSlug: schema.briefings.publicSlug,
    status: schema.briefings.status,
    progress: schema.briefings.progress,
    createdAt: schema.briefings.createdAt,
    opportunityId: schema.briefings.opportunityId,
  }).from(schema.briefings).orderBy(desc(schema.briefings.createdAt)).limit(20);

  return (
    <>
      <PageHeader
        eyebrow="Relacionamento"
        title="Formulários e Briefings Públicos"
        description="Acompanhe os formulários dinâmicos de captura e qualificação enviadas aos clientes."
        actions={
          <Link href="/app/comercial/briefings/novo" className="primary-button">
            <Plus className="size-4 mr-2" /> Novo Briefing
          </Link>
        }
      />

      <div className="mt-8 grid gap-4">
        {briefings.length === 0 ? (
          <Card className="p-8 text-center text-[var(--muted)]">
            <ClipboardCheck className="size-10 mx-auto mb-2 text-[var(--signal)] opacity-50" />
            <p className="text-sm font-bold text-[var(--text)]">Nenhum formulário ou briefing gerado ainda.</p>
            <p className="text-xs mt-1">Crie um novo briefing comercial para enviar ao seu cliente.</p>
          </Card>
        ) : (
          briefings.map((b) => {
            const isCompleted = b.status === "completed";
            const isSkipped = b.status === "skipped";

            return (
              <Card key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6 hover:border-[var(--signal)] transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge tone={isCompleted ? "success" : (isSkipped ? "neutral" : "signal")}>
                      {isCompleted ? "Concluído" : (isSkipped ? "Pulado" : "Pendente")}
                    </Badge>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{b.code}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--text)]">Briefing do Cliente ({b.code})</h3>
                  <div className="mt-3 flex items-center gap-6 text-xs text-[var(--muted)]">
                    <span className="flex items-center gap-1.5"><Activity className="size-3.5 text-[var(--signal)]" /> Progresso: {b.progress}%</span>
                    <span className="flex items-center gap-1.5"><Users className="size-3.5 text-[var(--signal)]" /> Criado em: {new Date(b.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/briefing/${b.publicSlug}`}
                    target="_blank"
                    className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2 text-xs font-bold text-[var(--text)] transition-colors hover:bg-[var(--line)]"
                  >
                    Link Público <ExternalLink className="size-3.5" />
                  </Link>
                  <Link
                    href={`/app/comercial/briefings/${b.id}`}
                    className="flex items-center gap-2 rounded-xl bg-[var(--signal)] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-orange-600 shadow-md shadow-orange-500/20"
                  >
                    Ver Respostas
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
