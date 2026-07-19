import type { LucideIcon } from "lucide-react";
import { Badge, Card } from "@pulso/ui";

export function IntegrationCard({
  icon: Icon, title, description, status, action = "Configurar"
}: {
  icon: LucideIcon; title: string; description: string;
  status: "Ativa" | "Opcional" | "Desativada" | "Manual"; action?: string;
}) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-[var(--soft)]"><Icon className="size-5" /></div>
        <Badge tone={status === "Ativa" ? "success" : status === "Manual" ? "signal" : "neutral"}>{status}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <button className="secondary-button mt-5 w-full justify-center">{action}</button>
      <button className="mt-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--carbon)]">Pular e configurar depois</button>
    </Card>
  );
}
