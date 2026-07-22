"use client";

import { useActionState, useEffect } from "react";
import { ActionState, createTeamMember } from "./actions";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";

export function NewMemberForm() {
  const [state, formAction, isPending] = useActionState(createTeamMember, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400">
          <CheckCircle2 className="size-4" />
          <span>Membro cadastrado com sucesso!</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1">Nome Completo *</label>
          <input
            type="text"
            name="name"
            placeholder="Ex: Ana Silva"
            required
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1">E-mail de Acesso *</label>
          <input
            type="email"
            name="email"
            placeholder="ana@empresa.com"
            required
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--muted)] mb-1">Cargo / Perfil *</label>
          <select
            name="role"
            defaultValue="member"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm font-semibold outline-none focus:border-[var(--signal)]"
          >
            <option value="member">Membro (Operacional)</option>
            <option value="admin">Administrador (Acesso Total)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[var(--signal)] px-5 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Cadastrando...</span>
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              <span>Cadastrar Membro</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
