"use client";

import { useState, useTransition } from "react";
import { logTimeEntry } from "../projetos/actions";

type Project = { id: string; code: string; name: string };

export function ManualTimeForm({ projects }: { projects: Project[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try { await logTimeEntry(formData); form.reset(); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível registrar."); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="manual-project">Projeto</label>
        <select id="manual-project" name="projectId" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
          <option value="">Selecione...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="manual-description">Descrição</label>
        <input id="manual-description" name="description" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="manual-date">Data</label>
          <input id="manual-date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="manual-duration">Duração (HH:MM)</label>
          <input id="manual-duration" name="duration" placeholder="01:30" required pattern="\d{1,3}:\d{2}" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs font-bold text-[var(--muted-strong)]">
        <input type="checkbox" name="billable" defaultChecked className="size-4" />Faturável
      </label>
      {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-xs font-semibold text-[var(--error)]">{error}</p>}
      <button type="submit" disabled={pending} className="primary-button w-full justify-center">{pending ? "Salvando..." : "Registrar horas"}</button>
    </form>
  );
}
