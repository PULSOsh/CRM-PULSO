import { db } from "@pulso/database";
import { eq } from "drizzle-orm";
import { adminNotifications } from "@pulso/database/schema";
import { HttpTelegramProvider } from "@pulso/integrations";
import { featureFlags } from "@pulso/integrations";

export interface NotifyAdminInput {
  eventKey: string;
  type: string;
  title: string;
  summary: string;
  payload?: Record<string, unknown>;
  actionUrl?: string;
}

export function generateEventKey(prefix: string, ...parts: string[]): string {
  const rawKey = [prefix, ...parts].join(":");
  if (rawKey.length <= 180) return rawKey;
  
  // Se for maior que 180, truncar e colocar um hash simples no final para unicidade
  // Isso é um fallback caso as chaves fiquem muito grandes.
  const hash = Array.from(rawKey).reduce((acc, char) => (acc + char.charCodeAt(0)) % 1000000, 0).toString(16);
  return `${rawKey.slice(0, 170)}-${hash}`;
}

export async function notifyAdmin(input: NotifyAdminInput) {
  const truncatedTitle = input.title.slice(0, 120);
  const truncatedSummary = input.summary.slice(0, 500);

  // truncate event key
  let key = input.eventKey;
  if (key.length > 180) {
    key = generateEventKey(key.substring(0, 170)); // fallback
  }

  try {
    const inserted = await db.insert(adminNotifications).values({
      eventKey: key,
      type: input.type,
      title: truncatedTitle,
      summary: truncatedSummary,
      payload: input.payload || {},
      actionUrl: input.actionUrl,
      telegramStatus: featureFlags.telegram ? "pending" : "disabled",
    }).onConflictDoNothing().returning();

    if (inserted.length === 0) {
      return { success: true, duplicated: true };
    }

    const notification = inserted[0];

    // Attempt Telegram Delivery
    if (featureFlags.telegram) {
      try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) {
          throw new Error("Missing Telegram configuration");
        }

        const telegram = new HttpTelegramProvider({ botToken: token });
        
        const messageText = `🔔 *${truncatedTitle.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1")}*\n\n${truncatedSummary.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1")}${input.actionUrl ? `\n\n[Acessar](${input.actionUrl})` : ""}`;

        const res = await telegram.sendMessage({
          chat_id: chatId,
          text: messageText,
          parse_mode: "MarkdownV2"
        });

        await db.update(adminNotifications).set({
          telegramStatus: "sent",
          telegramMessageId: res.message_id,
          telegramDeliveredAt: new Date(),
        }).where(eq(adminNotifications.id, notification.id));
      } catch (err) {
        await db.update(adminNotifications).set({
          telegramStatus: "error",
          telegramLastError: err instanceof Error ? err.message.slice(0, 255) : "Unknown error",
        }).where(eq(adminNotifications.id, notification.id));
        console.error("Telegram notification failed:", err);
      }
    }

    return { success: true, duplicated: false, notificationId: notification.id };
  } catch (err) {
    console.error("Failed to notify admin:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
