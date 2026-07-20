"use client";

import { PageHeader } from "@/components/page-header";
import { Card, Label, Input, Textarea } from "@pulso/ui";
import { useActionState } from "react";
import { createContact, type ContactActionState } from "../actions";

const initialState: ContactActionState = {};

export default function NewContactPage() {
  const [state, formAction, pending] = useActionState(createContact, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo contato" description="Registre uma pessoa para acompanhar o relacionamento." />
      <Card className="max-w-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--soft)] px-6 py-4">
          <h2 className="font-extrabold text-[var(--carbon)]">Dados do Contato</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Preencha as informações básicas do contato.</p>
        </div>
        <form className="p-6 space-y-5" action={formAction}>
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" name="name" required placeholder="Ex: João da Silva" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="joao@empresa.com" />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="document">CPF (opcional)</Label>
              <Input id="document" name="document" placeholder="000.000.000-00" />
            </div>
            <div>
              <Label htmlFor="role">Cargo</Label>
              <Input id="role" name="role" placeholder="Ex: Diretor de Marketing" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" placeholder="Ex: São Paulo, SP" />
            </div>
            <div>
              <Label htmlFor="origin">Origem</Label>
              <Input id="origin" name="origin" placeholder="De onde veio o contato" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notas adicionais</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Informações relevantes sobre este contato..." />
          </div>
          {state.error && (
            <p role="alert" className="rounded-xl border border-[#b3261e]/20 bg-[color:#b3261e/.08] px-4 py-3 text-sm font-semibold text-[#b3261e]">
              {state.error}{state.duplicateId && <a href={`/app/comercial/contatos/${state.duplicateId}`} className="ml-2 underline">Ver contato existente</a>}
            </p>
          )}
          <div className="pt-2">
            <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
              {pending ? "Salvando..." : "Criar contato"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
