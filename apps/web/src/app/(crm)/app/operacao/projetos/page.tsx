import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { ProjectCards } from "@/components/project-cards";
import { listProjects } from "./actions";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <>
      <PageHeader eyebrow="Operação" title="Projetos" description="Acompanhe progresso, prazo, horas, orçamento e aprovações de cada projeto."
        actions={<Link href="/app/operacao/projetos/novo" className="primary-button"><Plus className="size-4" />Novo projeto</Link>} />

      {projects.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[var(--muted)]">Nenhum projeto ainda. Gere um a partir de um contrato assinado.</Card>
      ) : (
        <ProjectCards projects={projects} />
      )}
    </>
  );
}
