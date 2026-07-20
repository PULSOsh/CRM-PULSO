"use client";

import { useState, useTransition } from "react";
import { decideApprovalInternally } from "../actions";

export function ApprovalDecisionInline({ approvalId, projectId }: { approvalId: string; projectId: string }) {
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>, decision: "approved" | "changes_requested") {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await decideApprovalInternally(approvalId, projectId, decision, formData); setMode("none"); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar a decisão."); }
    });
  }

  if (mode === "none") {
    return (
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("approve")} className="secondary-button px-3 py-1.5 text-xs">Aprovar internamente</button>
        <button type="button" onClick={() => setMode("reject")} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--error)]">Pedir alterações</button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => submit(e, mode === "approve" ? "approved" : "changes_requested")} className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
      <input name="name" placeholder="Nome de quem decidiu" required className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none" />
      <textarea name="comment" placeholder={mode === "reject" ? "O que precisa mudar (obrigatório)" : "Comentário (opcional)"} rows={2} required={mode === "reject"} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs outline-none" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="secondary-button px-3 py-1.5 text-xs">{pending ? "..." : "Confirmar"}</button>
        <button type="button" onClick={() => setMode("none")} className="text-xs font-bold text-[var(--muted)]">Cancelar</button>
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-[var(--error)]">{error}</p>}
    </form>
  );
}
