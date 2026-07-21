import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listSignedContractsWithoutProject } from "../actions";
import { CreateProjectButton } from "./create-button";
import { StandaloneProjectForm } from "./standalone-form";

export default async function NewProjectPage() {
  const contracts = await listSignedContractsWithoutProject();

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Novo projeto"
        description="Cadastre um projeto avulso ou gere um projeto a partir de um contrato comercial assinado."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form para Projeto Avulso */}
        <StandaloneProjectForm />

        {/* Projetos vinculados a Contratos Assinados */}
        <div>
          <h3 className="font-extrabold text-base text-[var(--text)] mb-2">A partir de Contrato Comercial</h3>
          <p className="text-xs text-[var(--muted)] mb-4">
            Contratos comerciais assinados aguardando geração de projeto.
          </p>

          <Card className="overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-lg">
            {contracts.length === 0 ? (
              <p className="p-6 text-sm text-[var(--muted)]">Nenhum contrato assinado sem projeto no momento.</p>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {contracts.map(({ contract, opportunityTitle }) => (
                  <div key={contract.id} className="flex items-center justify-between p-5 hover:bg-[var(--soft)]/50 transition-colors">
                    <div>
                      <p className="font-mono text-xs font-semibold text-[var(--muted)]">{contract.code}</p>
                      <p className="font-bold text-sm text-[var(--text)]">{opportunityTitle}</p>
                    </div>
                    <CreateProjectButton contractId={contract.id} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
