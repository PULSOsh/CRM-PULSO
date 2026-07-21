"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { deleteProject } from "../actions";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      router.push("/app/operacao/projetos");
    } catch (err) {
      console.error("Failed to delete project", err);
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <Trash2 className="size-3.5" /> Excluir Projeto
      </button>

      <ConfirmModal
        isOpen={isOpen}
        title="Excluir Projeto"
        description={`Tem certeza que deseja excluir o projeto "${projectName}"? Esta ação removerá o projeto do sistema.`}
        confirmText="Sim, Excluir Projeto"
        cancelText="Cancelar"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirm}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
