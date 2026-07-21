"use client";

import { useState, useActionState } from "react";
import { Card } from "@pulso/ui";
import { createStandaloneProject } from "../actions";
import { FolderPlus, Loader2, Repeat, FileCheck } from "lucide-react";

export function StandaloneProjectForm() {
  const [state, formAction, pending] = useActionState(createStandaloneProject, { error: undefined });
  const [projectType, setProjectType] = useState<"avulso" | "recorrente">("avulso");

  return (
    <Card className="p-6 border border-[var(--line)] bg-[var(--surface)] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <FolderPlus className="size-5 text-[var(--signal)]" />
        <h3 className="font-extrabold text-base text-[var(--text)]">Criar Novo Projeto Operacional</h3>
      </div>
      <p className="text-xs text-[var(--muted)] mb-5">
        Cadastre um projeto de escopo fechado ou de prestação de serviços continuada (mensalidade/retainer).
      </p>

      <form action={formAction} className="space-y-4">
        {/* Selector do Tipo de Projeto */}
        <div>
          <label className="block text-xs font-bold text-[var(--muted-strong)] mb-2">
            Tipo de Contratação / Modelo Operational *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProjectType("avulso")}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition-all ${
                projectType === "avulso"
                  ? "border-[var(--signal)] bg-[var(--signal)]/10 text-[var(--signal)] shadow-sm"
                  : "border-[var(--line)] bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FileCheck className="size-4" /> Projeto Avulso (Escopo Fixo)
            </button>

            <button
              type="button"
              onClick={() => setProjectType("recorrente")}
              className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition-all ${
                projectType === "recorrente"
                  ? "border-[var(--signal)] bg-[var(--signal)]/10 text-[var(--signal)] shadow-sm"
                  : "border-[var(--line)] bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Repeat className="size-4" /> Prestação de Serviços (Recorrente)
            </button>
          </div>
          <input type="hidden" name="projectType" value={projectType} />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="name">
            Nome do Projeto / Contrato de Serviço *
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder={
              projectType === "avulso"
                ? "Ex: Redesign de Marca e Website - Cliente X"
                : "Ex: Assessoria de Performance & Growth (Mensal) - Cliente Y"
            }
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectType === "avulso" ? (
            <div>
              <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="budget">
                Orçamento Previsto (R$)
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="monthlyValue">
                Valor Mensalidade R$/mês *
              </label>
              <input
                id="monthlyValue"
                name="monthlyValue"
                type="number"
                step="0.01"
                required={projectType === "recorrente"}
                placeholder="Ex: 3500.00"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="estimatedHours">
              Tempo Estimado de Trabalho {projectType === "recorrente" ? "(Horas/mês)" : "(Total de Horas)"}
            </label>
            <input
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              step="0.5"
              placeholder="Ex: 40"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--muted-strong)] mb-1" htmlFor="description">
            Descrição / Escopo dos Serviços Prestados
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Descreva as rotinas operacionais, entregáveis e SLA acordado..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)] text-[var(--text)]"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-[color:var(--error)/.08] p-3 text-xs font-bold text-[var(--error)]">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-4 py-3 font-bold text-sm text-white shadow-md hover:bg-orange-600 transition-all disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Criando projeto...
            </>
          ) : (
            "Criar Projeto Operacional"
          )}
        </button>
      </form>
    </Card>
  );
}
