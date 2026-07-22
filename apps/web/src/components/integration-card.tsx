import type { LucideIcon } from "lucide-react";
import { Badge, Card } from "@pulso/ui";

export function IntegrationCard({
  icon: Icon, title, description, status, action = "Configurar", onConfigure
}: {
  icon: LucideIcon; title: string; description: string;
  status: "Ativa" | "Opcional" | "Desativada" | "Manual"; action?: string;
  onConfigure?: () => void;
}) {
  return (
    <Card className="flex flex-col p-5 border border-[var(--line)] bg-[var(--surface)]/80 shadow-md hover:shadow-xl transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-[var(--soft)] text-[var(--signal)]"><Icon className="size-5" /></div>
        <Badge tone={status === "Ativa" ? "success" : status === "Manual" ? "signal" : "neutral"}>{status}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-[var(--text)]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <button 
        onClick={onConfigure} 
        className="secondary-button mt-5 w-full justify-center font-bold hover:border-[var(--signal)] hover:text-[var(--signal)] transition-colors cursor-pointer"
      >
        {action}
      </button>
    </Card>
  );
}
