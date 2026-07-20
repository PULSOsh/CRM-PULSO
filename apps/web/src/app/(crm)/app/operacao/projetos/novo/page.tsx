import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listSignedContractsWithoutProject } from "../actions";
import { CreateProjectButton } from "./create-button";

export default async function NewProjectPage() {
  const contracts = await listSignedContractsWithoutProject();

  return (
    <>
      <PageHeader eyebrow="Operação" title="Novo projeto" description="Escolha um contrato assinado para gerar o projeto." />
      <Card className="overflow-hidden">
        {contracts.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">Nenhum contrato assinado sem projeto no momento.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {contracts.map(({ contract, opportunityTitle }) => (
              <div key={contract.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--muted)]">{contract.code}</p>
                  <p className="font-bold">{opportunityTitle}</p>
                </div>
                <CreateProjectButton contractId={contract.id} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
