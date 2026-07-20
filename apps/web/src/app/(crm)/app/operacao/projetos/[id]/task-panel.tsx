"use client";

import { useState, useTransition } from "react";
import { Badge } from "@pulso/ui";
import { createTask, toggleTask } from "../actions";

type Task = { id: string; title: string; description: string | null; status: string; priority: string; dueAt: Date | string | null };

const priorityTone: Record<string, "neutral" | "signal" | "warning"> = { low: "neutral", normal: "neutral", high: "warning", urgent: "signal" };
const priorityLabel: Record<string, string> = { low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente" };

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition();

  function handleToggle(taskId: string, done: boolean) {
    startTransition(() => toggleTask(taskId, done));
  }

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-2">
      {tasks.length === 0 && <p className="text-sm text-[var(--muted)]">Nenhuma tarefa ainda.</p>}
      {[...open, ...done].map((task) => (
        <label key={task.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-3">
          <input type="checkbox" checked={task.status === "done"} onChange={(e) => handleToggle(task.id, e.target.checked)} className="mt-0.5 size-4" />
          <span className="min-w-0 flex-1">
            <span className={`block text-sm font-bold ${task.status === "done" ? "text-[var(--muted)] line-through" : ""}`}>{task.title}</span>
            {task.dueAt && <span className="mt-1 block text-xs text-[var(--muted)]">{new Date(task.dueAt).toLocaleDateString("pt-BR")}</span>}
          </span>
          <Badge tone={priorityTone[task.priority]}>{priorityLabel[task.priority] ?? task.priority}</Badge>
        </label>
      ))}
    </div>
  );
}

export function TaskCreateForm({ projectId }: { projectId: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try { await createTask(projectId, formData); form.reset(); }
      catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar a tarefa."); }
    });
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
        <input name="title" placeholder="Nova tarefa" required className="min-w-[180px] flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
        <input name="dueAt" type="date" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
        <select name="priority" defaultValue="normal" className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]">
          <option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option>
        </select>
        <button type="submit" disabled={pending} className="secondary-button px-3 py-2 text-xs">{pending ? "..." : "Adicionar"}</button>
      </form>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-[var(--error)]">{error}</p>}
    </div>
  );
}

export function TaskPanel({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  return (
    <div className="space-y-4">
      <TaskList tasks={tasks} />
      <div className="border-t border-[var(--line)] pt-4"><TaskCreateForm projectId={projectId} /></div>
    </div>
  );
}
