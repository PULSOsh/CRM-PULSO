"use client";

import { useTransition } from "react";
import { grantProjectAccess, revokeProjectAccess } from "../actions";

type Project = { id: string; code: string; name: string };

export function ProjectAccessList({ portalUserId, projects, grantedIds }: { portalUserId: string; projects: Project[]; grantedIds: string[] }) {
  const [pending, startTransition] = useTransition();
  const granted = new Set(grantedIds);

  return (
    <div className="space-y-2">
      {projects.length === 0 && <p className="text-sm text-[var(--muted)]">Esta empresa ainda não tem projetos.</p>}
      {projects.map((project) => {
        const hasAccess = granted.has(project.id);
        return (
          <div key={project.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] p-3">
            <div>
              <p className="text-sm font-bold">{project.name}</p>
              <p className="text-xs text-[var(--muted)]">{project.code}</p>
            </div>
            <button
              type="button" disabled={pending}
              onClick={() => startTransition(() => hasAccess ? revokeProjectAccess(portalUserId, project.id) : grantProjectAccess(portalUserId, project.id))}
              className={hasAccess ? "text-xs font-bold text-[var(--muted)] hover:text-[var(--error)]" : "secondary-button px-3 py-1.5 text-xs"}
            >
              {hasAccess ? "Remover acesso" : "Conceder acesso"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
