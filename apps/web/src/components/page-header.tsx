import type { ReactNode } from "react";

export function PageHeader({
  eyebrow, title, description, actions
}: {
  eyebrow?: string; title: string; description?: string; actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-extrabold tracking-[-0.045em] md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
