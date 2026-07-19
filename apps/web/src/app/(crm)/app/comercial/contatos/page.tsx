import Link from "next/link";
import { ArrowUpRight, Building2, Plus, Search, UserRound } from "lucide-react";
import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listCompanies, listContacts } from "./actions";

export default async function ContactsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "empresas" ? "empresas" : "contatos";
  const page = params.page ? Number(params.page) : 1;

  const contactsData = tab === "contatos" ? await listContacts({ q: params.q, page }) : null;
  const companiesData = tab === "empresas" ? await listCompanies({ q: params.q, page }) : null;

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Contatos e empresas"
        description="Uma visão 360º de pessoas, empresas e todo o histórico de relacionamento."
        actions={
          tab === "contatos"
            ? <Link href="/app/comercial/contatos/novo" className="primary-button"><Plus className="size-4" />Novo contato</Link>
            : <Link href="/app/comercial/contatos/empresas/novo" className="primary-button"><Plus className="size-4" />Nova empresa</Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/app/comercial/contatos?tab=contatos" className={`filter-chip ${tab === "contatos" ? "filter-chip-active" : ""}`}>
          <UserRound className="size-3.5" />Contatos
        </Link>
        <Link href="/app/comercial/contatos?tab=empresas" className={`filter-chip ${tab === "empresas" ? "filter-chip-active" : ""}`}>
          <Building2 className="size-3.5" />Empresas
        </Link>
      </div>

      <form className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2" action="/app/comercial/contatos">
        <input type="hidden" name="tab" value={tab} />
        <Search className="size-4 text-[var(--muted)]" />
        <input name="q" defaultValue={params.q ?? ""} placeholder={tab === "contatos" ? "Buscar por nome, e-mail ou telefone" : "Buscar por nome ou documento"} className="w-full bg-transparent text-sm outline-none" />
      </form>

      {tab === "contatos" && contactsData && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
                <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Nome</th><th className="px-5 py-4">E-mail</th><th className="px-5 py-4">Telefone</th><th className="px-5 py-4" /></tr>
              </thead>
              <tbody>
                {contactsData.rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum contato encontrado.</td></tr>}
                {contactsData.rows.map((contact) => (
                  <tr key={contact.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">{contact.code}</td>
                    <td className="px-5 py-4 font-bold"><Link href={`/app/comercial/contatos/${contact.id}`} className="hover:underline">{contact.name}</Link></td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">{contact.email ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">{contact.phone ?? "—"}</td>
                    <td className="px-5 py-4"><Link href={`/app/comercial/contatos/${contact.id}`} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--surface)]"><ArrowUpRight className="size-4" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "empresas" && companiesData && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
                <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Nome</th><th className="px-5 py-4">Documento</th><th className="px-5 py-4">Segmento</th><th className="px-5 py-4" /></tr>
              </thead>
              <tbody>
                {companiesData.rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhuma empresa encontrada.</td></tr>}
                {companiesData.rows.map((company) => (
                  <tr key={company.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                    <td className="px-5 py-4 font-mono text-xs font-semibold">{company.code}</td>
                    <td className="px-5 py-4 font-bold"><Link href={`/app/comercial/contatos/empresas/${company.id}`} className="hover:underline">{company.tradeName}</Link></td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">{company.document ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-[var(--muted)]">{company.segment ?? "—"}</td>
                    <td className="px-5 py-4"><Link href={`/app/comercial/contatos/empresas/${company.id}`} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--surface)]"><ArrowUpRight className="size-4" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
