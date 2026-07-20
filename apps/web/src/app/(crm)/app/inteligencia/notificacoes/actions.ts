"use server";

import { auth } from "@/lib/auth";
import { db, schema } from "@pulso/database";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { notifyAdmin } from "@/lib/notifications";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function markNotificationAsRead(id: string) {
  await requireSession();
  
  await db.update(schema.adminNotifications).set({ isRead: true }).where(eq(schema.adminNotifications.id, id));
  
  revalidatePath("/app/inteligencia/notificacoes");
  revalidatePath("/app/hoje");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  await requireSession();
  
  await db.update(schema.adminNotifications).set({ isRead: true }).where(eq(schema.adminNotifications.isRead, false));
  
  revalidatePath("/app/inteligencia/notificacoes");
  revalidatePath("/app/hoje");
  return { success: true };
}

export async function resendNotification(id: string) {
  await requireSession();
  
  const notifs = await db.select().from(schema.adminNotifications).where(eq(schema.adminNotifications.id, id));
  if (notifs.length === 0) throw new Error("Notification not found");
  
  const notif = notifs[0];
  
  // Try to send via telegram again by changing the event key temporarily or just executing the telegram part
  // Actually, we can just delete it and re-insert, or call notifyAdmin with a suffixed key, but we want to preserve the id or just resend.
  // Wait, notifyAdmin uses onConflictDoNothing on eventKey. If we pass the same key, it won't do anything.
  // Let's just delete the telegramStatus and call the logic again, but since notifyAdmin handles insertion, it's better to update the status to pending and re-trigger.
  // Wait, the plan says: "Server Actions autenticadas para marcar uma/todas como lidas e reenviar falha"
  
  // Let's modify the record so its eventKey is different to force re-insertion? No, it's better to do the same Telegram logic or just delete and re-notify.
  await db.delete(schema.adminNotifications).where(eq(schema.adminNotifications.id, id));
  
  await notifyAdmin({
    eventKey: notif.eventKey,
    type: notif.type,
    title: notif.title,
    summary: notif.summary,
    payload: notif.payload as any,
    actionUrl: notif.actionUrl ?? undefined
  });
  
  revalidatePath("/app/inteligencia/notificacoes");
  return { success: true };
}
