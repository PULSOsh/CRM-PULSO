import { NextRequest, NextResponse } from "next/server";
import { processTelegramWebhook } from "@/lib/telegram/processor";

export async function POST(req: NextRequest) {
  const secretToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!webhookSecret || !token || !chatId) {
    return NextResponse.json({ error: "Missing Telegram environment variables" }, { status: 500 });
  }

  if (!secretToken || secretToken !== webhookSecret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await processTelegramWebhook(secretToken, body, { token, chatId, webhookSecret });
    return NextResponse.json({ message: result.message }, { status: result.status || 200 });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook endpoint active" });
}
