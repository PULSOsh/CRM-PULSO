import { Badge, Card } from "@pulso/ui";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EntryActions } from "../entry-actions";
import { NewEntryForm } from "../new-entry-form";
import { createPersonalEntry, getFinancialSummary, listEntries } from "../actions";

const statusLabel: Record<string, string> = { pending: "Pendente", partial: "Parcial", paid: "Pago", overdue: "Vencido", cancelled: "Cancelado", refunded: "Estornado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { pending: "signal", partial: "warning", paid: "success", overdue: "neutral", cancelled: "neutral", refunded: "neutral" };
const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default async function PersonalFinancePage() {
  const [rows, summary] = await Promise.all([
    listEntries({ scope: "personal" }),
    getFinancialSummary("personal")
  ]);

  return (
    <>
      <PageHeader eyebrow="Livro separado da PULSO" title="Finanças pessoais" description="Nunca somado ao caixa da empresa sem uma visão consolidada explícita." />

      <Card className="mb-5 overflow-hidden bg-[var(--carbon)] text-[var(--paper)]">
        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="grid size-12 place-items-center rounded-xl bg-[var(--signal)]"><LockKeyhole className="size-5 text-white" /></div>
          <div><h2 className="font-extrabold">Livro pessoal, independente do caixa da PULSO</h2><p className="mt-1 text-sm text-[var(--neutral)]">Proteção adicional por PIN ainda não implementada nesta fase.</p></div>
          <Badge tone="success">Separado</Badge>
        </div>
      </Card>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[var(--muted)]">Saldo (pago)</p><ShieldCheck className="size-4 text-[var(--signal)]" /></div><p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{currency(summary.balance)}</p></Card>
        <Card className="p-5"><p className="text-xs font-bold text-[var(--muted)]">A receber pendente</p><p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{currency(summary.receivablePending)}</p></Card>
        <Card className="p-5"><p className="text-xs font-bold text-[var(--muted)]">A pagar pendente</p><p className="money-value mt-3 text-3xl font-black tracking-[-0.06em]">{currency(summary.payablePending)}</p></Card>
      </div>

      <details className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <summary className="cursor-pointer text-sm font-extrabold">+ Novo lançamento pessoal</summary>
        <div className="mt-4"><NewEntryForm action={createPersonalEntry} submitLabel="Criar lançamento" showDirection /></div>
      </details>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Descrição</th><th className="px-5 py-4">Tipo</th><th className="px-5 py-4">Valor</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Ações</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum lançamento pessoal ainda.</td></tr>}
              {rows.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{entry.code}</td>
                  <td className="px-5 py-4 font-bold">{entry.description}</td>
                  <td className="px-5 py-4"><Badge tone={entry.direction === "in" ? "success" : "neutral"}>{entry.direction === "in" ? "Receita" : "Despesa"}</Badge></td>
                  <td className="money-value px-5 py-4 font-bold">{currency(Number(entry.amountExpected))}</td>
                  <td className="px-5 py-4"><Badge tone={statusTone[entry.status]}>{statusLabel[entry.status] ?? entry.status}</Badge></td>
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
