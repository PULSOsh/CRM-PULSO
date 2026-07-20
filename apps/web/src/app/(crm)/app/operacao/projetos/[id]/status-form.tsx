"use client";

import { useState, useTransition } from "react";
import { updateProjectStatus } from "../actions";

const options = [
  { value: "planned", label: "Planejado" },
  { value: "active", label: "Ativo" },
  { value: "waiting", label: "Aguardando" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" }
];

export function ProjectStatusForm({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await updateProjectStatus(projectId, formData); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar o status."); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-[10px] font-bold text-[var(--muted)]" htmlFor="status">Status do projeto</label>
        <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {status === "completed" && (
        <div>
          <label className="mb-1 block text-[10px] font-bold text-[var(--muted)]" htmlFor="warrantyEndsAt">Garantia até (opcional)</label>
          <input id="warrantyEndsAt" name="warrantyEndsAt" type="date" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      )}
      <button type="submit" disabled={pending} className="secondary-button px-3 py-2 text-xs">{pending ? "Salvando..." : "Atualizar status"}</button>
      {error && <p role="alert" className="w-full text-xs font-semibold text-[var(--error)]">{error}</p>}
    </form>
  );
}
