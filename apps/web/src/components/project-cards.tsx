"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { ConfirmModal } from "./confirm-modal";
import { deleteProject } from "@/app/(crm)/app/operacao/projetos/actions";

const statusLabel: Record<string, string> = { planned: "Planejado", active: "Ativo", waiting: "Aguardando", completed: "Concluído", cancelled: "Cancelado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { planned: "neutral", active: "signal", waiting: "warning", completed: "success", cancelled: "neutral" };
const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type ProjectCard = { id: string; code: string; name: string; status: string; budget: string; dueAt: string | null };

export function ProjectCards({ projects: initialProjects }: { projects: ProjectCard[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.id;
    setIsDeleting(true);

    // Optimistic removal from local UI
    setProjects(prev => prev.filter(p => p.id !== targetId));

    try {
      await deleteProject(targetId);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      setProjects(initialProjects);
      setDeleteTarget(null);
      console.error("Failed to delete project", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="p-5 transition hover:border-[var(--signal)] relative group">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/app/operacao/projetos/${project.id}`} className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{project.code}</p>
                <h3 className="mt-2 text-lg font-extrabold text-[var(--text)] group-hover:text-[var(--signal)] transition-colors">{project.name}</h3>
              </Link>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[project.status]}>{statusLabel[project.status] ?? project.status}</Badge>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(project);
                  }}
                  title="Excluir projeto"
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            
            <Link href={`/app/operacao/projetos/${project.id}`} className="block mt-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[var(--muted)]">Orçamento</p>
                  <p className="money-value mt-1 text-2xl font-black tracking-[-0.06em] text-[var(--signal)]">{currency(Number(project.budget))}</p>
                </div>
                <p className="text-xs text-[var(--muted)]">{project.dueAt ? `Entrega ${new Date(project.dueAt).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}</p>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* PULSO Custom Confirm Modal for Projects */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Excluir Projeto"
        description={`Tem certeza que deseja excluir o projeto "${deleteTarget?.name}"? Esta ação removerá o projeto e desvinculará suas tarefas.`}
        confirmText="Sim, Excluir Projeto"
        cancelText="Cancelar"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
