import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { getOpenTimer, listProjects, listTimeEntries } from "../projetos/actions";
import { TimerWidget } from "./timer-widget";
import { ManualTimeForm } from "./manual-form";

export default async function HoursPage() {
  const [projects, entries, openTimer] = await Promise.all([listProjects(), listTimeEntries(), getOpenTimer()]);

  const totalMinutes = entries.reduce((sum, { entry }) => sum + entry.durationMinutes, 0);
  const billableMinutes = entries.reduce((sum, { entry }) => sum + (entry.billable ? entry.durationMinutes : 0), 0);

  return (
    <>
      <PageHeader eyebrow="Operação" title="Controle de horas" description="Timer, lançamentos manuais e comparação entre estimado e realizado." />

      <div className="mb-6"><TimerWidget projects={projects} openTimer={openTimer} /></div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <h2 className="font-extrabold">Lançamentos</h2>
            <span className="text-xs text-[var(--muted)]">{(totalMinutes / 60).toFixed(1)}h totais · {(billableMinutes / 60).toFixed(1)}h faturáveis</span>
          </div>
          {entries.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">Nenhum lançamento ainda.</p>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {entries.map(({ entry, projectName, projectCode }) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{entry.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{projectCode} — {projectName} · {new Date(entry.startedAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {!entry.billable && <Badge tone="neutral">Não faturável</Badge>}
                  <span className="font-mono text-sm font-bold">{(entry.durationMinutes / 60).toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit p-6">
          <h2 className="font-extrabold">Lançamento manual</h2>
          <div className="mt-4"><ManualTimeForm projects={projects} /></div>
        </Card>
      </div>
    </>
  );
}
