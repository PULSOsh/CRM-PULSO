"use client";

import { useTransition } from "react";
import { Play, Pause, XCircle, Trash2, RefreshCw } from "lucide-react";
import { pauseRecurrence, resumeRecurrence, cancelRecurrence, deleteRecurrence, processDueRecurrences } from "./actions";

export function ProcessDueButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await processDueRecurrences();
      if (res.error) {
        alert(`Erro ao processar: ${res.error}`);
      } else {
        alert(`Sucesso! ${res.processedCount} lançamento(s) gerado(s) em Contas a Receber/Pagar.`);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 rounded-xl border border-[var(--signal)]/40 bg-[var(--signal)]/10 px-4 py-2 text-xs font-bold text-[var(--signal)] shadow-sm hover:bg-[var(--signal)]/20 transition-all disabled:opacity-50 cursor-pointer"
    >
      <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
      <span>{isPending ? "Processando..." : "Processar Vencimentos Hoje"}</span>
    </button>
  );
}

export function RecurrenceRowActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  function handlePause() {
    startTransition(async () => {
      await pauseRecurrence(id);
    });
  }

  function handleResume() {
    startTransition(async () => {
      await resumeRecurrence(id);
    });
  }

  function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar esta recorrência?")) return;
    startTransition(async () => {
      await cancelRecurrence(id);
    });
  }

  function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta recorrência?")) return;
    startTransition(async () => {
      await deleteRecurrence(id);
    });
  }

  return (
    <div className="flex items-center gap-1">
      {status === "active" && (
        <button
          onClick={handlePause}
          disabled={isPending}
          title="Pausar"
          className="grid size-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-amber-400 hover:bg-[var(--soft)]"
        >
          <Pause className="size-3.5" />
        </button>
      )}

      {status === "paused" && (
        <button
          onClick={handleResume}
          disabled={isPending}
          title="Reativar"
          className="grid size-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-emerald-400 hover:bg-[var(--soft)]"
        >
          <Play className="size-3.5" />
        </button>
      )}

      {status !== "canceled" && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          title="Cancelar"
          className="grid size-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-rose-400 hover:bg-[var(--soft)]"
        >
          <XCircle className="size-3.5" />
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Excluir permanentemente"
        className="grid size-8 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-rose-500 hover:bg-[var(--soft)]"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
