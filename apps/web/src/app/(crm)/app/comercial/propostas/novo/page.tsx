"use client";

import { PageHeader } from "@/components/page-header";
import { OpportunityPicker } from "@/components/opportunity-picker";
import { Card } from "@pulso/ui";
import { useActionState } from "react";
import { createProposal, searchOpportunitiesForProposal, type ProposalActionState } from "../actions";

const initialState: ProposalActionState = {};

export default function NewProposalPage() {
  const [state, formAction, pending] = useActionState(createProposal, initialState);

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Nova proposta" description="A oportunidade precisa ter briefing concluído ou pulo justificado." />
      <Card className="max-w-xl p-6">
        <form className="space-y-4" action={formAction}>
          <OpportunityPicker searchAction={searchOpportunitiesForProposal} />
          {state.error && <p role="alert" className="rounded-lg bg-[color:var(--error)/.08] px-3 py-2 text-sm font-semibold text-[var(--error)]">{state.error}</p>}
          <button type="submit" disabled={pending} className="primary-button w-full justify-center sm:w-auto">{pending ? "Criando..." : "Criar rascunho de proposta"}</button>
        </form>
      </Card>
    </>
  );
}
