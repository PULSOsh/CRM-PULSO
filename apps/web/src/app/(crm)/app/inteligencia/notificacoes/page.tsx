import { db, schema } from "@pulso/database";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { Badge, Button } from "@pulso/ui";
import { Check, Mail, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { markAllNotificationsAsRead, markNotificationAsRead, resendNotification } from "./actions";

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `há ${days} dia${days > 1 ? "s" : ""}`;
  if (hours > 0) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  return "agora mesmo";
}

export default async function NotificacoesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const showUnreadOnly = filter !== "all";

  const notifications = await db.query.adminNotifications.findMany({
    where: showUnreadOnly ? eq(schema.adminNotifications.isRead, false) : undefined,
    orderBy: [desc(schema.adminNotifications.createdAt)],
    limit: 100,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Central de Notificações"
        description="Acompanhe alertas administrativos e de eventos do sistema"
        actions={
          <>
            <Link href="/app/inteligencia/notificacoes?filter=all" className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition ${!showUnreadOnly ? "bg-[var(--signal)] text-white" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--carbon)] hover:brightness-95"}`}>
              Todas
            </Link>
            <Link href="/app/inteligencia/notificacoes" className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition ${showUnreadOnly ? "bg-[var(--signal)] text-white" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--carbon)] hover:brightness-95"}`}>
              Não lidas
            </Link>
            <form action={async () => { "use server"; await markAllNotificationsAsRead(); }}>
              <button type="submit" className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--carbon)] transition hover:brightness-95">
                <Check className="mr-2 size-4" />
                Marcar lidas
              </button>
            </form>
          </>
        }
      />

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] py-12 text-center">
            <Mail className="mx-auto mb-4 size-12 text-[var(--muted)]" />
            <h3 className="text-lg font-medium text-[var(--carbon)]">Nenhuma notificação</h3>
            <p className="text-sm text-[var(--muted)]">
              Você está em dia com os alertas do sistema.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl border border-[var(--line)] p-5 transition-colors ${notif.isRead ? "bg-[var(--surface)]" : "bg-[var(--signal)]/5 border-[var(--signal)]/20"}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-bold text-[var(--carbon)]">{notif.title}</h4>
                  {!notif.isRead && <Badge tone="signal">Nova</Badge>}
                  {notif.telegramStatus === "sent" && <Badge tone="info">Telegram</Badge>}
                  {notif.telegramStatus === "error" && <Badge tone="danger">Falha Telegram</Badge>}
                </div>
                <div className="text-sm font-medium text-[var(--muted)]">
                  {formatRelativeTime(new Date(notif.createdAt))}
                </div>
              </div>
              <p className="mb-5 whitespace-pre-wrap text-sm text-[var(--carbon)]">{notif.summary}</p>
              
              <div className="flex items-center gap-3">
                {notif.actionUrl && (
                  <Link href={notif.actionUrl} className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--carbon)] transition hover:brightness-95">
                    <ExternalLink className="mr-1.5 size-3" />
                    Acessar
                  </Link>
                )}
                {!notif.isRead && (
                  <form action={async () => { "use server"; await markNotificationAsRead(notif.id); }}>
                    <button type="submit" className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--carbon)] transition hover:bg-[var(--soft)]">
                      <Check className="mr-1.5 size-3" />
                      Marcar como lida
                    </button>
                  </form>
                )}
                {notif.telegramStatus === "error" && (
                  <form action={async () => { "use server"; await resendNotification(notif.id); }}>
                    <button type="submit" className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold text-[color:#b3261e] transition hover:bg-[color:#b3261e]/.08">
                      <RefreshCw className="mr-1.5 size-3" />
                      Tentar Telegram novamente
                    </button>
                  </form>
                )}
              </div>
              
              {notif.telegramLastError && (
                <div className="mt-4 rounded-xl border border-[#b3261e]/20 bg-[color:#b3261e]/.05 p-3 text-xs text-[#b3261e]">
                  <span className="font-bold">Erro no Telegram:</span> {notif.telegramLastError}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
