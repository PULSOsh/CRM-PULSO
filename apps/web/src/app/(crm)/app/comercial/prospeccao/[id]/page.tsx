import { getProspectingList, listItemsForProspectingList } from "../actions";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProspectingView } from "./prospecting-view";
import { ProspectingImportModal } from "./import-modal";

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
        actions={<ProspectingImportModal listId={id} />}
      />

      <div className="mt-6">
        <ProspectingView items={items} />
      </div>
    </>
  );
}
