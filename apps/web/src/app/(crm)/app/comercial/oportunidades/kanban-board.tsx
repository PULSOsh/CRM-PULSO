"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { useState, useTransition } from "react";
import { updateOpportunityStage, deleteOpportunity } from "./actions";
import { StageSelect } from "./stage-select";
import { ConfirmModal } from "@/components/confirm-modal";

type Opportunity = {
  id: string;
  code: string;
  title: string;
  expectedValue: string | null;
  nextActionAt: Date | null;
};

type StageColumn = {
  stage: { id: string; name: string };
  opportunities: Opportunity[];
};

export function KanbanBoard({ initialStages }: { initialStages: StageColumn[] }) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allStagesList = stages.map((s) => ({ id: s.stage.id, name: s.stage.name }));

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColIndex = stages.findIndex(s => s.stage.id === source.droppableId);
    const destColIndex = stages.findIndex(s => s.stage.id === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = stages[sourceColIndex];
    const destCol = stages[destColIndex];

    const newStages = [...stages];
    
    if (source.droppableId === destination.droppableId) {
      const newOpps = Array.from(sourceCol.opportunities);
      const [movedOpp] = newOpps.splice(source.index, 1);
      newOpps.splice(destination.index, 0, movedOpp);
      
      newStages[sourceColIndex] = { ...sourceCol, opportunities: newOpps };
      setStages(newStages);
    } else {
      const sourceOpps = Array.from(sourceCol.opportunities);
      const destOpps = Array.from(destCol.opportunities);
      
      const [movedOpp] = sourceOpps.splice(source.index, 1);
      destOpps.splice(destination.index, 0, movedOpp);
      
      newStages[sourceColIndex] = { ...sourceCol, opportunities: sourceOpps };
      newStages[destColIndex] = { ...destCol, opportunities: destOpps };
      
      setStages(newStages);
      
      startTransition(async () => {
        try {
          await updateOpportunityStage(draggableId, destination.droppableId);
        } catch (error) {
          setStages(initialStages);
          console.error("Failed to update stage:", error);
        }
      });
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    setIsDeleting(true);

    // Optimistic removal from local Kanban UI
    setStages(prev => prev.map(col => ({
      ...col,
      opportunities: col.opportunities.filter(o => o.id !== targetId)
    })));

    try {
      await deleteOpportunity(targetId);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      // Revert local state if error occurs
      setStages(initialStages);
      setDeleteTarget(null);
      setErrorMessage(err.message || "Erro ao excluir oportunidade.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex h-full gap-4 min-w-max">
            {stages.map((col) => (
              <div key={col.stage.id} className="flex flex-col w-[320px] shrink-0 rounded-2xl bg-[var(--soft)] p-3 border border-[var(--line)]">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-extrabold text-[var(--carbon)]">{col.stage.name}</h3>
                  <Badge tone="neutral" className="bg-[var(--surface)] shadow-sm">{col.opportunities.length}</Badge>
                </div>
                
                <Droppable droppableId={col.stage.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto space-y-3 pr-1 pb-2 transition-colors ${snapshot.isDraggingOver ? 'bg-[var(--line)]/10 rounded-xl' : ''}`}
                      style={{ minHeight: "150px" }}
                    >
                      {col.opportunities.map((opp, index) => {
                        const noNextAction = !opp.nextActionAt;
                        return (
                          <Draggable key={opp.id} draggableId={opp.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.9 : 1,
                                  transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'none'
                                }}
                              >
                                <Card className={`p-4 hover:border-[var(--signal)] transition-colors shadow-sm group ${snapshot.isDragging ? 'shadow-xl border-[var(--signal)] rotate-2' : ''}`}>
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <Link href={`/app/comercial/oportunidades/${opp.id}`} className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--muted)] hover:text-[var(--signal)]">
                                      {opp.code}
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteTarget({ id: opp.id, title: opp.title });
                                      }}
                                      title="Excluir oportunidade"
                                      className="text-[var(--muted)] hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                  <Link href={`/app/comercial/oportunidades/${opp.id}`} className="block">
                                    <p className="font-extrabold leading-tight group-hover:text-[var(--signal)] transition-colors">{opp.title}</p>
                                    
                                    <div className="mt-3 flex items-center justify-between bg-[var(--soft)] rounded-lg p-2 border border-[var(--line)]">
                                      <p className="money-value text-sm font-bold text-[var(--signal)]">
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(opp.expectedValue))}
                                      </p>
                                      {noNextAction && (
                                        <span title="Sem próxima ação"><AlertTriangle className="size-4 text-amber-500" /></span>
                                      )}
                                    </div>
                                  </Link>
                                  <div className="mt-3 pt-3 border-t border-[var(--line)]">
                                    <StageSelect opportunityId={opp.id} currentStageId={col.stage.id} stages={allStagesList} />
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {col.opportunities.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]">
                          <p className="text-xs text-[var(--muted)]">Arraste para cá.</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* PULSO Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Excluir Oportunidade"
        description={`Tem certeza que deseja excluir a oportunidade "${deleteTarget?.title}"? Esta ação removerá a oportunidade do funil de vendas.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* PULSO Error Alert Modal */}
      <ConfirmModal
        isOpen={Boolean(errorMessage)}
        title="Atenção"
        description={errorMessage || ""}
        confirmText="Entendido"
        cancelText="Fechar"
        tone="signal"
        onConfirm={() => setErrorMessage(null)}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}
