import { ArrowUpRight, Filter, Plus, SlidersHorizontal } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "./page-header";

const rows = [
  ["PULSO-2026-0014", "Clínica Horizonte", "Proposta enviada", "R$ 2.500,00", "Hoje, 14:30"],
  ["PULSO-2026-0013", "Atlas Odonto", "Em andamento", "R$ 5.000,00", "Amanhã"],
  ["PULSO-2026-0012", "Base Norte", "Aguardando cliente", "R$ 3.000,00", "22/07/2026"],
  ["PULSO-2026-0011", "Studio Cais", "Novo", "R$ 1.500,00", "24/07/2026"]
];

export function ModulePreview({ title, description, eyebrow = "Módulo" }: { title: string; description: string; eyebrow?: string }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={
        <>
          <button className="secondary-button"><Filter className="size-4" />Filtros</button>
          <button className="primary-button"><Plus className="size-4" />Novo registro</button>
        </>
      } />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="filter-chip filter-chip-active">Todos</button>
        <button className="filter-chip">Precisa de atenção</button>
        <button className="filter-chip">Sem próxima ação</button>
        <button className="filter-chip"><SlidersHorizontal className="size-3.5" />Salvar visualização</button>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-4">Código</th><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Valor</th><th className="px-5 py-4">Próxima ação</th><th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row[0]} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{row[0]}</td>
                  <td className="px-5 py-4 font-bold">{row[1]}</td>
                  <td className="px-5 py-4"><Badge tone={index === 0 ? "signal" : index === 1 ? "success" : "neutral"}>{row[2]}</Badge></td>
                  <td className="money-value px-5 py-4 font-bold">{row[3]}</td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{row[4]}</td>
                  <td className="px-5 py-4"><button className="grid size-8 place-items-center rounded-lg hover:bg-[var(--surface)]"><ArrowUpRight className="size-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
