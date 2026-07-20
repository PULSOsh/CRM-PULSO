"use client";

import { useState, useTransition } from "react";
import { replyToTicketFromPortal } from "../../../actions";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try { await replyToTicketFromPortal(ticketId, formData); form.reset(); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar."); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
      <textarea name="body" placeholder="Escreva uma mensagem" required rows={3} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      {error && <p role="alert" className="text-xs font-semibold text-[var(--error)]">{error}</p>}
      <button type="submit" disabled={pending} className="primary-button">{pending ? "Enviando..." : "Enviar mensagem"}</button>
    </form>
  );
}
