import { Badge, Card } from "@pulso/ui";
import { projects } from "@pulso/database/demo";

export function ProjectBoard() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {projects.map(project => (
        <Card key={project.code} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{project.code}</p><h3 className="mt-2 text-lg font-extrabold">{project.name}</h3></div>
            <Badge tone={project.progress > 80 ? "success" : "neutral"}>{project.status}</Badge>
          </div>
          <div className="mt-7 flex items-end justify-between">
            <div><p className="text-xs text-[var(--muted)]">Progresso</p><p className="mt-1 text-3xl font-black tracking-[-0.06em]">{project.progress}%</p></div>
            <p className="text-xs text-[var(--muted)]">Entrega {project.due}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--soft)]"><div className="h-full rounded-full bg-[var(--signal)]" style={{ width: `${project.progress}%` }} /></div>
        </Card>
      ))}
    </div>
  );
}
