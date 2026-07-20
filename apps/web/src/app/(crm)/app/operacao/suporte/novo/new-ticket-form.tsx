"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CompanyPicker } from "@/components/company-picker";
import { createTicketInternally, searchCompaniesForTicket } from "../actions";

export function NewTicketForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTicketInternally(formData);
      if (result.error) { setError(result.error); return; }
      router.push(`/app/operacao/suporte/${result.ticketId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CompanyPicker searchAction={searchCompaniesForTicket} />
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="title">Título</label>
        <input id="title" name="title" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="description">Descrição</label>
        <textarea id="description" name="description" required rows={5} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Salvando..." : "Criar chamado"}</button>
    </form>
  );
}
