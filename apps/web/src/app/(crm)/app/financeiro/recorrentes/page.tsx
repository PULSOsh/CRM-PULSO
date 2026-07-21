import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { db } from "@pulso/database";
import * as schema from "@pulso/database/schema";
import { eq, desc } from "drizzle-orm";
import { NewRecurrenceForm } from "./new-recurrence-form";
import { createRecurrence } from "./actions";

const statusLabel: Record<string, string> = { active: "Ativo", paused: "Pausado", canceled: "Cancelado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { active: "success", paused: "warning", canceled: "neutral" };
const directionLabel: Record<string, string> = { income: "Receita", expense: "Despesa" };
const directionTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { income: "success", expense: "signal" };
const frequencyLabel: Record<string, string> = { monthly: "Mensal", weekly: "Semanal", yearly: "Anual" };

export default async function RecurrencesPage() {
  const rows = await db.select()
    .from(schema.financialRecurrences)
    .where(eq(schema.financialRecurrences.scope, "pulso")) // Adjust if using proper scope logic
    .orderBy(desc(schema.financialRecurrences.createdAt));

  return (
    <>
      <PageHeader eyebrow="Financeiro" title="Dívidas Mensais & Recorrentes" description="Gerencie suas contas fixas mensais e contratos de receita recorrente." />

      <details className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 ">
        <summary className="cursor-pointer text-sm font-extrabold text-[var(--foreground)] hover:text-[var(--signal)] transition-colors">+ Nova Recorrência</summary>
        <div className="mt-4"><NewRecurrenceForm action={createRecurrence} submitLabel="Salvar Contrato" /></div>
      </details>

      <Card className="overflow-hidden bg-[var(--surface)]/80  border border-[var(--line)] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)]/50 font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-4">Descrição</th>
                <th className="px-5 py-4">Valor</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Frequência</th>
                <th className="px-5 py-4">Próx. Vencimento</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhuma recorrência ainda.</td></tr>}
              {rows.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]/30 transition-colors">
                  <td className="px-5 py-4 font-bold text-white">{entry.description}</td>
                  <td className="money-value px-5 py-4">
                    <span className={`font-bold ${entry.direction === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(entry.amount))}
                    </span>
                  </td>
                  <td className="px-5 py-4"><Badge tone={directionTone[entry.direction]}>{directionLabel[entry.direction]}</Badge></td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{frequencyLabel[entry.frequency]}</td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{new Date(entry.nextDueDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-5 py-4"><Badge tone={statusTone[entry.status]}>{statusLabel[entry.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
