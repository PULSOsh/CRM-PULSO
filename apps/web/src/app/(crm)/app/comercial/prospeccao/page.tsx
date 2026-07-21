import Link from "next/link";
import { Plus, Upload, Search, Target } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listProspectingLists } from "./actions";

export default async function ProspeccaoPage() {
  const lists = await listProspectingLists();

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Prospecção"
        description="Gerencie listas de contatos para prospectar ativamente antes de virarem Leads ou Oportunidades."
        actions={
          <Link href="/app/comercial/prospeccao/novo" className="primary-button">
            <Plus className="size-4" />Nova lista
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {lists.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[var(--soft)] text-[var(--muted)]">
              <Target className="size-6" />
            </div>
            <p className="text-sm font-medium text-[var(--text)]">Nenhuma lista de prospecção</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Crie uma lista para começar a organizar seus contatos frios.</p>
          </div>
        ) : (
          lists.map(({ list, itemCount }) => (
            <Link key={list.id} href={`/app/comercial/prospeccao/${list.id}`}>
              <Card className="group flex h-full flex-col justify-between p-5 hover:border-[var(--signal)]/50 transition-colors">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--muted)]">{list.code}</span>
                    <Badge tone="neutral">{itemCount} contatos</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--text)] group-hover:text-[var(--signal)] transition-colors">{list.name}</h3>
                  {list.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{list.description}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-[var(--muted)]">
                  Criada em {new Date(list.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
