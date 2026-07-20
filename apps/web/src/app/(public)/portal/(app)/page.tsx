import Link from "next/link";
import { Badge, Card } from "@pulso/ui";
import { getPortalSession } from "@/lib/portal-auth";
import { getAccessibleProjects, getCompanyTickets } from "./data";

const statusLabel: Record<string, string> = { planned: "Planejado", active: "Ativo", waiting: "Aguardando", completed: "Concluído", cancelled: "Cancelado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "warning"> = { planned: "neutral", active: "signal", waiting: "warning", completed: "success", cancelled: "neutral" };

export default async function PortalDashboardPage() {
  const portalUser = await getPortalSession();
  if (!portalUser) return null;

  const [projects, tickets] = await Promise.all([getAccessibleProjects(portalUser.id), getCompanyTickets(portalUser.companyId)]);
  const openTickets = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-[-0.05em]">Olá, {portalUser.name}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Projetos, aprovações e suporte em um só lugar.</p>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Seus projetos</h2>
        <Link href="/portal/suporte" className="text-sm font-bold text-[var(--signal)]">Suporte ({openTickets.length} aberto{openTickets.length === 1 ? "" : "s"})</Link>
      </div>

      {projects.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-sm text-[var(--muted)]">Nenhum projeto liberado para você ainda.</Card>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/portal/projetos/${project.id}`}>
              <Card className="p-5 transition hover:border-[var(--signal)]">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{project.code}</p><h3 className="mt-2 text-lg font-extrabold">{project.name}</h3></div>
                  <Badge tone={statusTone[project.status]}>{statusLabel[project.status] ?? project.status}</Badge>
                </div>
                {project.dueAt && <p className="mt-6 text-xs text-[var(--muted)]">Entrega prevista {new Date(project.dueAt).toLocaleDateString("pt-BR")}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
