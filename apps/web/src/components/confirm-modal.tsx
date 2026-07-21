"use client";

import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@pulso/ui";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "signal" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Excluir Definitivamente",
  cancelText = "Cancelar",
  tone = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl transition-all border-t-4 border-t-[var(--signal)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-[var(--muted)] hover:bg-[var(--line)]/50 hover:text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
            tone === "danger" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-orange-500/10 text-[var(--signal)] border border-orange-500/20"
          }`}>
            {tone === "danger" ? <Trash2 className="size-6" /> : <AlertTriangle className="size-6" />}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-extrabold text-[var(--text)] tracking-tight">{title}</h3>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--muted)]">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-2.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--line)] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg ${
              tone === "danger" 
                ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                : "bg-[var(--signal)] hover:bg-orange-600 shadow-orange-500/20"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" /> Excluindo...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
