import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listAcceptedProposalsWithoutContract } from "../actions";
import { CreateContractButton } from "./create-button";

export default async function NewContractPage() {
  const proposals = await listAcceptedProposalsWithoutContract();

  return (
    <>
      <PageHeader eyebrow="Comercial" title="Novo contrato" description="Escolha uma proposta aceita para gerar o rascunho do contrato." />
      <Card className="overflow-hidden">
        {proposals.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">Nenhuma proposta aceita sem contrato no momento.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {proposals.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--muted)]">{p.code}</p>
                  <p className="font-bold">{p.opportunityTitle}</p>
                </div>
                <CreateContractButton proposalId={p.id} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
