"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { testTelegram, registerTelegramWebhook, sendTelegramTestMessage } from "./actions";

export function TelegramIntegrationCard({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "testing" | "active" | "error">("idle");
  const [botName, setBotName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleTest() {
    setStatus("testing");
    setErrorMessage(null);

    const testRes = await testTelegram();
    if (!testRes.success) {
      setStatus("error");
      setErrorMessage(testRes.error || "Erro ao conectar com a API.");
      return;
    }

    const webhookRes = await registerTelegramWebhook();
    if (!webhookRes.success) {
      setStatus("error");
      setErrorMessage(webhookRes.error || "Erro ao registrar webhook.");
      return;
    }

    setBotName(testRes.botName || "Bot");
    setStatus("active");
  }

  async function handleSendTest() {
    await sendTelegramTestMessage();
    alert("Mensagem enviada!");
  }

  const isEnabled = enabled;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-[var(--soft)]">
          <MessageCircle className="size-5" />
        </div>
        {!isEnabled ? (
          <Badge tone="neutral">Desativada</Badge>
        ) : status === "active" ? (
          <Badge tone="success" className="flex items-center gap-1"><CheckCircle className="size-3"/> Ativa</Badge>
        ) : status === "error" ? (
          <Badge tone="signal" className="flex items-center gap-1"><XCircle className="size-3"/> Erro</Badge>
        ) : status === "testing" ? (
          <Badge tone="neutral" className="flex items-center gap-1"><Loader2 className="size-3 animate-spin"/> Em teste</Badge>
        ) : (
          <Badge tone="neutral">Não testada</Badge>
        )}
      </div>
      
      <h3 className="mt-5 text-lg font-extrabold">Telegram</h3>
      
      <div className="mt-2 flex-1 space-y-2 text-sm leading-6 text-[var(--muted)]">
        <p>Alertas administrativos privados, central e comandos rápidos.</p>
        {status === "active" && botName && (
          <div className="rounded border border-green-200 bg-green-50 p-2 text-green-800 text-xs">
            Conectado como <strong>{botName}</strong>. Webhook registrado.
          </div>
        )}
        {status === "error" && errorMessage && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-red-800 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {!isEnabled ? (
          <p className="text-xs text-[var(--muted)]">Habilite configurando as variáveis de ambiente.</p>
        ) : (
          <>
            <button 
              onClick={handleTest}
              disabled={status === "testing"}
              className="secondary-button w-full justify-center disabled:opacity-50"
            >
              {status === "testing" ? "Testando e configurando..." : status === "active" ? "Re-testar conexão" : "Testar e Configurar"}
            </button>
            {status === "active" && (
              <button 
                onClick={handleSendTest}
                className="secondary-button w-full justify-center mt-2"
              >
                Enviar mensagem de teste
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
