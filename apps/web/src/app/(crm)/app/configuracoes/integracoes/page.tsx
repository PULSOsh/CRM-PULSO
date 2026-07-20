import { Bot, CalendarDays, CreditCard, Mail, PenTool } from "lucide-react";
import { IntegrationCard } from "@/components/integration-card";
import { PageHeader } from "@/components/page-header";
import { TelegramIntegrationCard } from "./telegram-card";
import { featureFlags } from "@pulso/integrations";

const integrations = [
  { icon: Mail, title: "E-mail", description: "Templates HTML/CSS, SMTP, Resend e modo de desenvolvimento.", status: "Manual" as const, action: "Configurar provider" },
  { icon: CalendarDays, title: "Google Calendar", description: "Sincronização bidirecional opcional de tarefas e eventos.", status: "Opcional" as const },
  { icon: PenTool, title: "ZapSign", description: "Assinatura externa prioritária. Assinatura interna segue disponível.", status: "Opcional" as const },
  { icon: CreditCard, title: "AbacatePay", description: "Cobranças somente após confirmação. Fluxo manual continua disponível.", status: "Opcional" as const },
  { icon: Bot, title: "Inteligência artificial", description: "OpenAI, Anthropic, Gemini ou modo desativado.", status: "Desativada" as const }
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader eyebrow="Configurações" title="Integrações" description="Nenhuma integração bloqueia o uso do CRM. Configure agora, teste ou deixe para depois." />
      <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 text-sm leading-6 text-[var(--muted-strong)]">
        <strong className="text-[var(--carbon)]">Modo seguro:</strong> todos os módulos possuem alternativa manual. Erros de conexão geram aviso, mas não travam o sistema.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TelegramIntegrationCard enabled={featureFlags.telegram} />
        {integrations.map(i=><IntegrationCard key={i.title} {...i} />)}
      </div>
    </>
  );
}
