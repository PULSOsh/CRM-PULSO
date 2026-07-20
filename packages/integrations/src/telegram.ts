export const TELEGRAM_MESSAGE_PARSE_MODE = {
  HTML: "HTML",
  MARKDOWN: "MarkdownV2",
} as const;

export type TelegramMessageParseMode = typeof TELEGRAM_MESSAGE_PARSE_MODE[keyof typeof TELEGRAM_MESSAGE_PARSE_MODE];

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections?: number;
  allowed_updates?: string[];
}

export interface TelegramSendMessageInput {
  chat_id: string | number;
  text: string;
  parse_mode?: TelegramMessageParseMode;
  reply_markup?: {
    inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
  };
}

export interface TelegramAnswerCallbackQueryInput {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
}

export interface TelegramProviderConfig {
  botToken: string;
  fetchFn?: typeof fetch;
}

export class HttpTelegramProvider {
  private botToken: string;
  private fetch: typeof fetch;

  constructor(config: TelegramProviderConfig) {
    if (!config.botToken) throw new Error("Telegram bot token is required");
    this.botToken = config.botToken;
    this.fetch = config.fetchFn ?? globalThis.fetch;
  }

  private async callApi<T>(method: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await this.fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const data = (await response.json()) as { ok: boolean; result?: T; description?: string; error_code?: number };
      if (!data.ok) {
        throw new Error(`Telegram API Error ${data.error_code || 500}: ${data.description || "Unknown error"}`);
      }
      return data.result as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Telegram API Error: Request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getMe(): Promise<TelegramUser> {
    return this.callApi<TelegramUser>("getMe");
  }

  async getWebhookInfo(): Promise<TelegramWebhookInfo> {
    return this.callApi<TelegramWebhookInfo>("getWebhookInfo");
  }

  async setWebhook(input: { url: string; secret_token?: string }): Promise<boolean> {
    return this.callApi<boolean>("setWebhook", input);
  }

  async sendMessage(input: TelegramSendMessageInput): Promise<{ message_id: number }> {
    return this.callApi<{ message_id: number }>("sendMessage", input);
  }

  async answerCallbackQuery(input: TelegramAnswerCallbackQueryInput): Promise<boolean> {
    return this.callApi<boolean>("answerCallbackQuery", input);
  }
}
