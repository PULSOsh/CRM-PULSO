import { CalendarDays, GanttChart, KanbanSquare, LayoutDashboard, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProjectBoard } from "@/components/project-board";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader eyebrow="Operação" title="Projetos" description="Acompanhe progresso, prazo, horas, orçamento, dependências, marcos e aprovações."
        actions={<button className="primary-button"><Plus className="size-4" />Novo projeto</button>} />
      <div className="mb-5 flex flex-wrap gap-2">
        <button className="filter-chip filter-chip-active"><LayoutDashboard className="size-4" />Visão geral</button>
        <button className="filter-chip"><KanbanSquare className="size-4" />Kanban</button>
        <button className="filter-chip"><GanttChart className="size-4" />Cronograma</button>
        <button className="filter-chip"><CalendarDays className="size-4" />Calendário</button>
      </div>
      <ProjectBoard />
    </>
  );
}
