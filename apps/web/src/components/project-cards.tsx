import Link from "next/link";
import { Badge, Card } from "@pulso/ui";

const statusLabel: Record<string, string> = { planned: "Planejado", active: "Ativo", waiting: "Aguardando", completed: "Concluído", cancelled: "Cancelado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { planned: "neutral", active: "signal", waiting: "warning", completed: "success", cancelled: "neutral" };
const currency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type ProjectCard = { id: string; code: string; name: string; status: string; budget: string; dueAt: string | null };

export function ProjectCards({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/app/operacao/projetos/${project.id}`}>
          <Card className="p-5 transition hover:border-[var(--signal)]">
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{project.code}</p><h3 className="mt-2 text-lg font-extrabold">{project.name}</h3></div>
              <Badge tone={statusTone[project.status]}>{statusLabel[project.status] ?? project.status}</Badge>
            </div>
            <div className="mt-7 flex items-end justify-between">
              <div><p className="text-xs text-[var(--muted)]">Orçamento</p><p className="money-value mt-1 text-2xl font-black tracking-[-0.06em]">{currency(Number(project.budget))}</p></div>
              <p className="text-xs text-[var(--muted)]">{project.dueAt ? `Entrega ${new Date(project.dueAt).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
