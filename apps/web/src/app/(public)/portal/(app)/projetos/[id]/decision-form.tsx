"use client";

import { useState, useTransition } from "react";
import { decideApprovalFromPortal } from "../../../actions";

export function PortalApprovalDecision({ approvalId, projectId }: { approvalId: string; projectId: string }) {
  const [mode, setMode] = useState<"none" | "reject">("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "approved" | "changes_requested", formData?: FormData) {
    setError(null);
    startTransition(async () => {
      try { await decideApprovalFromPortal(approvalId, projectId, decision, formData ?? new FormData()); setMode("none"); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar a decisão."); }
    });
  }

  if (mode === "reject") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); decide("changes_requested", new FormData(e.currentTarget)); }} className="mt-3 space-y-2">
        <textarea name="comment" placeholder="O que precisa mudar?" required rows={2} className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="secondary-button px-3 py-1.5 text-xs">{pending ? "..." : "Enviar"}</button>
          <button type="button" onClick={() => setMode("none")} className="text-xs font-bold text-[var(--muted)]">Cancelar</button>
        </div>
        {error && <p role="alert" className="text-xs font-semibold text-[var(--error)]">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-3 flex gap-2">
      <button type="button" disabled={pending} onClick={() => decide("approved")} className="primary-button px-3 py-1.5 text-xs">{pending ? "..." : "Aprovar"}</button>
      <button type="button" disabled={pending} onClick={() => setMode("reject")} className="secondary-button px-3 py-1.5 text-xs">Solicitar alterações</button>
      {error && <p role="alert" className="w-full text-xs font-semibold text-[var(--error)]">{error}</p>}
    </div>
  );
}
