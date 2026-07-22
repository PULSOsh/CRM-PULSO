"use client";

import { useState } from "react";
import { Bot, CalendarDays, CreditCard, Mail, PenTool, Sparkles } from "lucide-react";
import { IntegrationCard } from "@/components/integration-card";
import { TelegramIntegrationCard } from "./telegram-card";
import { IntegrationModal } from "./integration-modal";

interface IntegrationsViewProps {
  telegramEnabled: boolean;
  savedConfig: Record<string, Record<string, string>>;
}

const integrationsList = [
  { key: "email", icon: Mail, title: "E-mail", description: "Templates HTML/CSS, SMTP, Resend API e modo de desenvolvimento." },
  { key: "gcalendar", icon: CalendarDays, title: "Google Calendar", description: "Sincronização bidirecional de tarefas, reuniões e eventos." },
  { key: "zapsign", icon: PenTool, title: "ZapSign", description: "Assinatura digital externa prioritária. Assinatura interna disponível." },
  { key: "abacatepay", icon: CreditCard, title: "AbacatePay", description: "Cobranças PIX/Cartão automáticas por link ou QR Code." },
  { key: "ai", icon: Bot, title: "Inteligência Artificial", description: "Google Gemini, OpenAI GPT-4o ou Groq Llama 3." },
];

export function IntegrationsView({ telegramEnabled, savedConfig }: IntegrationsViewProps) {
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);

  const activeIntegration = integrationsList.find((i) => i.key === activeModalKey);

  function getStatus(key: string): "Ativa" | "Opcional" | "Desativada" | "Manual" {
    const conf = savedConfig[key];
    if (!conf) return "Opcional";
    if (Object.keys(conf).some((k) => conf[k] && conf[k].trim().length > 0)) return "Ativa";
    return "Opcional";
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TelegramIntegrationCard enabled={telegramEnabled} />
        {integrationsList.map((item) => (
          <IntegrationCard
            key={item.key}
            icon={item.icon}
            title={item.title}
            description={item.description}
            status={getStatus(item.key)}
            action="Configurar Chaves"
            onConfigure={() => setActiveModalKey(item.key)}
          />
        ))}
      </div>

      {activeIntegration && (
        <IntegrationModal
          keyName={activeIntegration.key}
          title={activeIntegration.title}
          description={activeIntegration.description}
          initialValues={savedConfig[activeIntegration.key] || {}}
          open={Boolean(activeModalKey)}
          onClose={() => setActiveModalKey(null)}
        />
      )}
    </>
  );
}
