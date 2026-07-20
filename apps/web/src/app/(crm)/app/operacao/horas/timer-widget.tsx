"use client";

import { useState, useTransition } from "react";
import { startTimer, stopTimer } from "../projetos/actions";

type Project = { id: string; code: string; name: string };
type OpenTimer = { entry: { id: string; startedAt: Date | string; description: string }; projectName: string } | null;

export function TimerWidget({ projects, openTimer }: { projects: Project[]; openTimer: OpenTimer }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await startTimer(formData);
      if (result.error) setError(result.error);
    });
  }

  function handleStop() {
    if (!openTimer) return;
    startTransition(() => stopTimer(openTimer.entry.id));
  }

  if (openTimer) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
        <div>
          <p className="text-xs font-bold text-[var(--signal)]">Timer rodando — {openTimer.projectName}</p>
          <p className="mt-1 text-sm font-bold">{openTimer.entry.description}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Iniciado em {new Date(openTimer.entry.startedAt).toLocaleTimeString("pt-BR")}</p>
        </div>
        <button type="button" disabled={pending} onClick={handleStop} className="primary-button">{pending ? "Parando..." : "Parar timer"}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleStart} className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-[10px] font-bold text-[var(--muted)]" htmlFor="timer-project">Projeto</label>
        <select id="timer-project" name="projectId" required className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]">
          <option value="">Selecione...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-[10px] font-bold text-[var(--muted)]" htmlFor="timer-description">O que você está fazendo?</label>
        <input id="timer-description" name="description" required className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <button type="submit" disabled={pending} className="primary-button">{pending ? "Iniciando..." : "Iniciar timer"}</button>
      {error && <p role="alert" className="w-full text-xs font-semibold text-[var(--error)]">{error}</p>}
    </form>
  );
}
