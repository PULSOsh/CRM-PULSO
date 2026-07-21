"use client";

import type { schema } from "@pulso/database";
import { Check, Cloud, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { completeBriefing, saveBriefingResponses } from "./actions";

type Question = schema.BriefingQuestion;

export function BriefingForm({
  briefingId, token, code, title, questions, initialResponses, initialProgress
}: {
  briefingId: string; token: string; code: string; title: string;
  questions: Question[]; initialResponses: Record<string, unknown>; initialProgress: number;
}) {
  const [responses, setResponses] = useState<Record<string, unknown>>(initialResponses);
  const [progress, setProgress] = useState(initialProgress);
  const [saving, startSaving] = useTransition();
  const [completing, startCompleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  function persist(next: Record<string, unknown>) {
    setResponses(next);
    startSaving(async () => {
      const result = await saveBriefingResponses(briefingId, token, next);
      setProgress(result.progress);
    });
  }

  function setValue(id: string, value: unknown) {
    persist({ ...responses, [id]: value });
  }

  function toggleMulti(id: string, option: string) {
    const current = Array.isArray(responses[id]) ? (responses[id] as string[]) : [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    setValue(id, next);
  }

  async function handleComplete() {
    setError(null);
    startCompleting(async () => {
      try {
        await completeBriefing(briefingId, token);
        setIsCompleted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível concluir o briefing.");
      }
    });
  }

  if (isCompleted) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{code}</p>
        <h1 className="mt-3 text-2xl font-extrabold">Briefing concluído com sucesso</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Obrigado! Recebemos suas respostas e nossa equipe já está com elas em mãos.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{code} · {title}</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] md:text-6xl">Vamos entender seu projeto.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">Suas respostas ficam salvas automaticamente e podem ser retomadas depois.</p>
      </div>
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs font-bold"><span>Progresso do briefing</span><span>{progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--soft)]"><div className="h-full bg-[var(--signal)] transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm md:p-8">
        {questions.map((question) => (
          <div key={question.id}>
            <label htmlFor={question.id} className="mb-2 block text-sm font-bold">
              {question.label}{question.required && <span className="text-[var(--signal)]"> *</span>}
            </label>
            {question.helpText && <p className="mb-2 text-xs text-[var(--muted)]">{question.helpText}</p>}

            {(question.type === "text" || question.type === "link") && (
              <input
                id={question.id} type="text" defaultValue={(responses[question.id] as string) ?? ""}
                onBlur={(e) => setValue(question.id, e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--signal)]"
              />
            )}
            {question.type === "textarea" && (
              <textarea
                id={question.id} defaultValue={(responses[question.id] as string) ?? ""}
                onBlur={(e) => setValue(question.id, e.target.value)}
                className="min-h-32 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--signal)]"
              />
            )}
            {question.type === "date" && (
              <input
                id={question.id} type="date" defaultValue={(responses[question.id] as string) ?? ""}
                onBlur={(e) => setValue(question.id, e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--signal)]"
              />
            )}
            {question.type === "currency" && (
              <input
                id={question.id} type="text" inputMode="decimal" placeholder="R$ 0,00" defaultValue={(responses[question.id] as string) ?? ""}
                onBlur={(e) => setValue(question.id, e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--signal)]"
              />
            )}
            {question.type === "boolean" && (
              <div id={question.id} className="flex gap-2">
                {["Sim", "Não"].map((opt) => (
                  <button key={opt} type="button" onClick={() => setValue(question.id, opt)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${responses[question.id] === opt ? "border-[var(--signal)] bg-[var(--signal)] text-white" : "border-[var(--line)]"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {question.type === "select" && (
              <select
                id={question.id} defaultValue={(responses[question.id] as string) ?? ""}
                onChange={(e) => setValue(question.id, e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--signal)]"
              >
                <option value="" disabled>Selecione</option>
                {question.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            {question.type === "multiselect" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options?.map((opt) => {
                  const selected = Array.isArray(responses[question.id]) && (responses[question.id] as string[]).includes(opt);
                  return (
                    <label key={opt} onClick={() => toggleMulti(question.id, opt)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] p-4 font-semibold">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${selected ? "border-[var(--signal)] bg-[var(--signal)] text-white" : "border-[var(--line)]"}`}>
                        {selected && <Check className="size-3" />}
                      </span>
                      {opt}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{error}</p>}

        <div className="flex items-center justify-between border-t border-[var(--line)] pt-5">
          <span className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
            {saving ? <><Loader2 className="size-4 animate-spin" />Salvando...</> : <><Cloud className="size-4" />Salvo automaticamente</>}
          </span>
          <button onClick={handleComplete} disabled={completing} className="primary-button">
            {completing ? "Enviando..." : "Concluir briefing"}
          </button>
        </div>
      </div>
    </main>
  );
}
