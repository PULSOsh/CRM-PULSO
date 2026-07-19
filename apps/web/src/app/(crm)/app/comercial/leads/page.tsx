import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listLeads } from "./actions";

const statusLabel: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualifying: "Qualificando",
  qualified: "Qualificado",
  disqualified: "Desqualificado",
  converted: "Convertido"
};

const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = {
  new: "signal",
  contacted: "neutral",
  qualifying: "warning",
  qualified: "success",
  disqualified: "neutral",
  converted: "success"
};

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { rows, total, page, totalPages } = await listLeads({
    q: params.q,
    status: params.status,
    page: params.page ? Number(params.page) : 1
  });

  const filters = [
    { label: "Todos", value: undefined },
    { label: "Novo", value: "new" },
    { label: "Contatado", value: "contacted" },
    { label: "Qualificando", value: "qualifying" },
    { label: "Sem próxima ação", value: "no-next-action" }
  ];

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Leads"
        description="Capture, qualifique e acompanhe novos contatos sem perder o próximo passo."
        actions={
          <Link href="/app/comercial/leads/novo" className="primary-button">
            <Plus className="size-4" />Novo lead
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/app/comercial/leads">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
          <Search className="size-4 text-[var(--muted)]" />
          <input name="q" defaultValue={params.q ?? ""} placeholder="Buscar por nome, e-mail, telefone ou empresa" className="w-full bg-transparent text-sm outline-none" />
        </div>
        {filters.map((f) => (
          <button
            key={f.label}
            type="submit"
            name="status"
            value={f.value ?? ""}
            className={`filter-chip ${(params.status ?? "") === (f.value ?? "") ? "filter-chip-active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </form>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-4">Código</th><th className="px-5 py-4">Nome</th><th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Contato</th><th className="px-5 py-4">Próxima ação</th><th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum lead encontrado.</td></tr>
              )}
              {rows.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{lead.code}</td>
                  <td className="px-5 py-4 font-bold">
                    <Link href={`/app/comercial/leads/${lead.id}`} className="hover:underline">{lead.name}</Link>
                    {lead.companyName ? <span className="block text-xs font-normal text-[var(--muted)]">{lead.companyName}</span> : null}
                  </td>
                  <td className="px-5 py-4"><Badge tone={statusTone[lead.status]}>{statusLabel[lead.status]}</Badge></td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{lead.phone}</td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{lead.nextActionAt ? new Date(lead.nextActionAt).toLocaleString("pt-BR") : "—"}</td>
                  <td className="px-5 py-4">
                    <Link href={`/app/comercial/leads/${lead.id}`} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--surface)]">
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
            <span>{total} leads · página {page} de {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link className="secondary-button px-3 py-1.5 text-xs" href={`/app/comercial/leads?page=${page - 1}${params.q ? `&q=${params.q}` : ""}`}>Anterior</Link>}
              {page < totalPages && <Link className="secondary-button px-3 py-1.5 text-xs" href={`/app/comercial/leads?page=${page + 1}${params.q ? `&q=${params.q}` : ""}`}>Próxima</Link>}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
