"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@pulso/ui";
import { useActionState } from "react";
import { createContact, type ContactActionState } from "../actions";

const initialState: ContactActionState = {};

export default function NewContactPage() {
  const [state, formAction, pending] = useActionState(createContact, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo contato" description="Registre uma pessoa para acompanhar o relacionamento." />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" action={formAction}>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
            <input id="name" name="name" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="phone">Telefone</label>
              <input id="phone" name="phone" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="document">CPF (opcional)</label>
              <input id="document" name="document" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="role">Cargo</label>
              <input id="role" name="role" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="city">Cidade</label>
              <input id="city" name="city" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="origin">Origem</label>
              <input id="origin" name="origin" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="notes">Notas</label>
            <textarea id="notes" name="notes" rows={3} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          {state.error && (
            <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">
              {state.error}{state.duplicateId && <a href={`/app/comercial/contatos/${state.duplicateId}`} className="ml-2 underline">Ver contato existente</a>}
            </p>
          )}
          <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Salvando..." : "Criar contato"}</button>
        </form>
      </Card>
    </>
  );
}
