"use client";

import type { schema } from "@pulso/database";
import { useActionState } from "react";
import { updateContact, type ContactActionState } from "../actions";

const initialState: ContactActionState = {};
type Contact = typeof schema.contacts.$inferSelect;

export function ContactEditForm({ contact }: { contact: Contact }) {
  const [state, formAction, pending] = useActionState(updateContact.bind(null, contact.id), initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
        <input id="name" name="name" defaultValue={contact.name} required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" defaultValue={contact.email ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" defaultValue={contact.phone ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="document">CPF</label>
          <input id="document" name="document" defaultValue={contact.document ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="role">Cargo</label>
          <input id="role" name="role" defaultValue={contact.role ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="city">Cidade</label>
          <input id="city" name="city" defaultValue={contact.city ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="origin">Origem</label>
          <input id="origin" name="origin" defaultValue={contact.origin ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={contact.notes ?? ""} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
      <button type="submit" disabled={pending} className="primary-button">{pending ? "Salvando..." : "Salvar alterações"}</button>
    </form>
  );
}
