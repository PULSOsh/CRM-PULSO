"use client";

import { PageHeader } from "@/components/page-header";
import { Card, Label, Input, Textarea, Select } from "@pulso/ui";
import { useActionState } from "react";
import { createLead, type LeadActionState } from "../actions";

const initialState: LeadActionState = {};

export default function NewLeadPage() {
  const [state, formAction, pending] = useActionState(createLead, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo lead" description="Registre manualmente um contato interessado." />
      <Card className="max-w-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--soft)] px-6 py-4">
          <h2 className="font-extrabold text-[var(--carbon)]">Dados do Lead</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Preencha os campos abaixo para iniciar o processo comercial.</p>
        </div>
        <form className="p-6 space-y-5" action={formAction}>
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" name="name" required placeholder="Ex: Maria Silva" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" name="phone" required placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input id="email" name="email" type="email" placeholder="maria@empresa.com" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="companyName">Empresa (opcional)</Label>
              <Input id="companyName" name="companyName" placeholder="Nome da empresa" />
            </div>
            <div>
              <Label htmlFor="service">Serviço de interesse</Label>
              <Input id="service" name="service" placeholder="Ex: Criação de site" />
            </div>
          </div>
          <div>
            <Label htmlFor="source">Canal de Origem</Label>
            <Select id="source" name="source">
              <option value="manual">Manual</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="site">Site corporativo</option>
              <option value="outro">Outros canais</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Mensagem ou Contexto adicional</Label>
            <Textarea id="message" name="message" rows={4} placeholder="Insira qualquer detalhe relevante fornecido pelo lead..." />
          </div>
          {state.error && <p role="alert" className="rounded-xl border border-[#b3261e]/20 bg-[color:#b3261e/.08] px-4 py-3 text-sm font-semibold text-[#b3261e]">{state.error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
              {pending ? "Salvando..." : "Criar lead"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
