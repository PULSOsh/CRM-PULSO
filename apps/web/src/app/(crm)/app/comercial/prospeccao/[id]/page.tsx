import { getProspectingList, listItemsForProspectingList, deleteProspectingList } from "../actions";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProspectingView } from "./prospecting-view";
import { ProspectingImportModal } from "./import-modal";
import { Trash2 } from "lucide-react";

export default async function ProspectingListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await getProspectingList(id);
  if (!list) notFound();

  const items = await listItemsForProspectingList(id);

  return (
    <>
      <PageHeader
        eyebrow="Prospecção"
        title={list.name}
        description={list.description || "Gerencie os contatos desta lista de prospecção."}
        actions={
          <div className="flex items-center gap-2">
            <ProspectingImportModal listId={id} />
            <form action={deleteProspectingList.bind(null, id)}>
              <button
                type="submit"
                className="secondary-button !border-red-500/30 !text-red-400 hover:!bg-red-500/10"
                title="Excluir esta lista e todos os seus contatos"
              >
                <Trash2 className="size-4" /> Excluir Lista
              </button>
            </form>
          </div>
        }
      />

      <div className="mt-6">
        <ProspectingView items={items} />
      </div>
    </>
  );
}
