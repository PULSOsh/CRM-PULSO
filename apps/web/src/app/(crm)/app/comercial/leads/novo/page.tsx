"use client";

import { PageHeader } from "@/components/page-header";
import { Card } from "@pulso/ui";
import { useActionState } from "react";
import { createLead, type LeadActionState } from "../actions";

const initialState: LeadActionState = {};

export default function NewLeadPage() {
  const [state, formAction, pending] = useActionState(createLead, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo lead" description="Registre manualmente um contato interessado." />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" action={formAction}>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="name">Nome</label>
            <input id="name" name="name" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="phone">Telefone</label>
              <input id="phone" name="phone" required className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="email">E-mail</label>
              <input id="email" name="email" type="email" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="companyName">Empresa (opcional)</label>
              <input id="companyName" name="companyName" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="service">Serviço de interesse</label>
              <input id="service" name="service" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="source">Origem</label>
            <select id="source" name="source" className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]">
              <option value="manual">Manual</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="site">Site</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[var(--muted-strong)]" htmlFor="message">Mensagem / contexto</label>
            <textarea id="message" name="message" rows={3} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--signal)]" />
          </div>
          {state.error && <p role="alert" className="rounded-lg bg-[color:#b3261e/.08] px-3 py-2 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
          <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
            {pending ? "Salvando..." : "Criar lead"}
          </button>
        </form>
      </Card>
    </>
  );
}
