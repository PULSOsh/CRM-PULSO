"use client";

import { useState, useTransition } from "react";
import { decideApprovalPublic } from "./actions";

export function ApprovalDecisionForm({ approvalId, slug, token }: { approvalId: string; slug: string; token: string }) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(decision: "approved" | "changes_requested") {
    setError(null);
    if (!name.trim()) { setError("Informe seu nome completo."); return; }
    if (decision === "changes_requested" && !comment.trim()) { setError("Descreva o que precisa mudar."); return; }
    startTransition(async () => {
      try {
        await decideApprovalPublic(approvalId, slug, token, decision, { name, comment });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível registrar a decisão.");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <h2 className="text-lg font-extrabold">Sua decisão</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm outline-none focus:border-[var(--signal)]" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário (obrigatório se solicitar alterações)" rows={3} className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm outline-none focus:border-[var(--signal)]" />
      {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-xs font-semibold text-[var(--error)]">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={pending} onClick={() => submit("approved")} className="primary-button w-full justify-center sm:w-auto">{pending ? "Enviando..." : "Aprovar"}</button>
        <button type="button" disabled={pending} onClick={() => submit("changes_requested")} className="secondary-button w-full justify-center sm:w-auto">{pending ? "Enviando..." : "Solicitar alterações"}</button>
      </div>
    </div>
  );
}
