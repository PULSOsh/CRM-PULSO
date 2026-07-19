import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listProducts } from "./actions";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const { rows, categories } = await listProducts({ q: params.q, category: params.category });

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Produtos e serviços"
        description="Catálogo comercial com preços, margens, templates e regras de briefing."
        actions={<Link href="/app/comercial/produtos/novo" className="primary-button"><Plus className="size-4" />Novo produto</Link>}
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/app/comercial/produtos">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
          <Search className="size-4 text-[var(--muted)]" />
          <input name="q" defaultValue={params.q ?? ""} placeholder="Buscar por nome ou código" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <button type="submit" name="category" value="" className={`filter-chip ${!params.category ? "filter-chip-active" : ""}`}>Todas</button>
        {categories.map((c) => (
          <button key={c} type="submit" name="category" value={c} className={`filter-chip ${params.category === c ? "filter-chip-active" : ""}`}>{c}</button>
        ))}
      </form>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-[var(--line)] bg-[var(--soft)] font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Nome</th><th className="px-5 py-4">Categoria</th><th className="px-5 py-4">Preço base</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--muted)]">Nenhum produto encontrado.</td></tr>}
              {rows.map((product) => (
                <tr key={product.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--soft)]">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">{product.code}</td>
                  <td className="px-5 py-4 font-bold"><Link href={`/app/comercial/produtos/${product.id}`} className="hover:underline">{product.name}</Link></td>
                  <td className="px-5 py-4 text-sm text-[var(--muted)]">{product.category}</td>
                  <td className="money-value px-5 py-4 font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.basePrice))}</td>
                  <td className="px-5 py-4"><Badge tone={product.status === "archived" ? "neutral" : "success"}>{product.status === "archived" ? "Arquivado" : "Ativo"}</Badge></td>
                  <td className="px-5 py-4"><Link href={`/app/comercial/produtos/${product.id}`} className="grid size-8 place-items-center rounded-lg hover:bg-[var(--surface)]"><ArrowUpRight className="size-4" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
