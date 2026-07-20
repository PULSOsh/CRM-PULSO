"use server";

import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@pulso/database/audit";
import { HttpTelegramProvider, featureFlags } from "@pulso/integrations";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function testTelegram() {
  const session = await requireSession();
  
  if (!featureFlags.telegram) return { success: false, error: "Telegram não está habilitado via variáveis de ambiente." };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, error: "Falta TELEGRAM_BOT_TOKEN." };

  try {
    const telegram = new HttpTelegramProvider({ botToken: token });
    const me = await telegram.getMe();
    
    await recordAuditEvent({
      actorType: "user", actorId: session.user.id, action: "integration.telegram.tested",
      entityType: "integration", entityId: "telegram"
    });

    return { success: true, botName: me.first_name, botUsername: me.username };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

export async function registerTelegramWebhook() {
  const session = await requireSession();

  if (!featureFlags.telegram) return { success: false, error: "Telegram não está habilitado." };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const baseUrl = process.env.BETTER_AUTH_URL || process.env.APP_URL;

  if (!token || !webhookSecret || !baseUrl) {
    return { success: false, error: "Falta configuração de webhook no ambiente (token, secret ou url base)." };
  }

  const webhookUrl = `${baseUrl}/api/integrations/telegram/webhook`;

  try {
    const telegram = new HttpTelegramProvider({ botToken: token });
    await telegram.setWebhook({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"]
    });

    await recordAuditEvent({
      actorType: "user", actorId: session.user.id, action: "integration.telegram.webhook_registered",
      entityType: "integration", entityId: "telegram", after: { webhookUrl }
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

export async function sendTelegramTestMessage() {
  const session = await requireSession();

  if (!featureFlags.telegram) return { success: false, error: "Telegram não está habilitado." };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, error: "Falta configuração (token ou chatId)." };
  }

  try {
    const telegram = new HttpTelegramProvider({ botToken: token });
    await telegram.sendMessage({
      chat_id: chatId,
      text: "Mensagem de teste enviada pelo PULSO CRM 🚀\n\nSe você está recebendo esta mensagem, o bot está configurado corretamente."
    });

    await recordAuditEvent({
      actorType: "user", actorId: session.user.id, action: "integration.telegram.test_message_sent",
      entityType: "integration", entityId: "telegram"
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}
