"use client";

import { PageHeader } from "@/components/page-header";
import { Card, Label, Input, Textarea } from "@pulso/ui";
import { useActionState } from "react";
import { createCompany, type CompanyActionState } from "../../actions";

const initialState: CompanyActionState = {};

export default function NewCompanyPage() {
  const [state, formAction, pending] = useActionState(createCompany, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Nova empresa" description="Registre uma empresa cliente ou parceira." />
      <Card className="max-w-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--soft)] px-6 py-4">
          <h2 className="font-extrabold text-[var(--carbon)]">Dados da Empresa</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Registre as informações de uma empresa cliente ou parceira.</p>
        </div>
        <form className="p-6 space-y-5" action={formAction}>
          <div>
            <Label htmlFor="tradeName">Nome fantasia</Label>
            <Input id="tradeName" name="tradeName" required placeholder="Ex: Acme Corp" />
          </div>
          <div>
            <Label htmlFor="legalName">Razão social</Label>
            <Input id="legalName" name="legalName" placeholder="Acme Corporation LTDA" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="document">CNPJ</Label>
              <Input id="document" name="document" placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <Label htmlFor="segment">Segmento</Label>
              <Input id="segment" name="segment" placeholder="Ex: Tecnologia, Varejo" />
            </div>
          </div>
          <div>
            <Label htmlFor="website">Site</Label>
            <Input id="website" name="website" placeholder="https://www.exemplo.com.br" />
          </div>
          <div>
            <Label htmlFor="notes">Notas adicionais</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Informações relevantes sobre a empresa..." />
          </div>
          {state.error && (
            <p role="alert" className="rounded-xl border border-[var(--error)]/20 bg-[color:var(--error)/.08] px-4 py-3 text-sm font-semibold text-[var(--error)]">
              {state.error}{state.duplicateId && <a href={`/app/comercial/contatos/empresas/${state.duplicateId}`} className="ml-2 underline">Ver empresa existente</a>}
            </p>
          )}
          <div className="pt-2">
            <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">
              {pending ? "Salvando..." : "Criar empresa"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
