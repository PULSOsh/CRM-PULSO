import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { EntryActions } from "../entry-actions";
import { NewEntryForm } from "../new-entry-form";
import { createPayable, listEntries } from "../actions";

function formatDateBR(d: string | Date | null): string {
  if (!d) return '—';
  const s = typeof d === 'string' ? d : d.toISOString();
  const [y, m, day] = s.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

const statusLabel: Record<string, string> = { pending: "Pendente", partial: "Parcial", paid: "Pago", overdue: "Vencido", cancelled: "Cancelado", refunded: "Estornado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning" | "danger"> = { pending: "signal", partial: "warning", paid: "success", overdue: "danger", cancelled: "neutral", refunded: "neutral" };

export default async function PayablesPage() {
  const rows = await listEntries({ scope: "company", direction: "out" });

  return (
    <>
      <PageHeader eyebrow="Financeiro" title="Contas a pagar" description="Despesas, fornecedores e previsão de caixa. Baixa e estorno manuais." />

      <details className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <summary className="cursor-pointer text-sm font-extrabold">+ Nova despesa</summary>
        <div className="mt-4"><NewEntryForm action={createPayable} submitLabel="Criar despesa" /></div>
      </details>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Descrição</th><th className="px-5 py-4">Valor</th><th className="px-5 py-4">Vencimento</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Ações</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhuma despesa ainda.</td></tr>}
              {rows.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{entry.code}</td>
                  <td className="px-5 py-4 font-bold">{entry.description}{entry.category && <span className="block text-xs font-normal text-[var(--muted)]">{entry.category}</span>}</td>
                  <td className="money-value px-5 py-4">
                    <span className="font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(entry.amountExpected))}</span>
                    {Number(entry.amountActual) > 0 && <span className="block text-xs text-[var(--muted)]">Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(entry.amountActual))}</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{formatDateBR(entry.dueDate)}</td>
                  <td className="px-5 py-4"><Badge tone={statusTone[entry.status] as any}>{statusLabel[entry.status] ?? entry.status}</Badge></td>
                  <td className="px-5 py-4"><EntryActions entryId={entry.id} canPay={entry.status === "pending" || entry.status === "partial"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
