import { db, schema } from "@pulso/database";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { Badge, Button } from "@pulso/ui";
import { Check, Mail, ExternalLink, RefreshCw, AlertOctagon } from "lucide-react";
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

      <div className="space-y-4 relative z-10">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)]/50  py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--soft)] border border-[var(--line)] shadow-xl mb-4">
              <Mail className="size-6 text-[var(--muted)]" />
            </div>
            <h3 className="text-lg font-extrabold text-[var(--text)]">Caixa de entrada limpa</h3>
            <p className="mt-2 text-sm font-medium text-[var(--muted)] max-w-sm mx-auto">
              Você está em dia com todos os alertas do sistema. Novas notificações aparecerão aqui.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id}
                className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${isUnread ? "bg-[var(--surface)]/90 border-[var(--signal)]/40 shadow-lg shadow-[var(--signal)]/5" : "bg-[var(--surface)]/60 border-[var(--line)] hover:border-[var(--line)]/80"} `}
              >
                {isUnread && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--signal)] shadow-[0_0_10px_rgba(var(--signal-rgb),0.5)]"></div>
                )}
                
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className={`text-lg font-bold ${isUnread ? "text-[var(--text)]" : "text-[var(--carbon)]"}`}>{notif.title}</h4>
                    {isUnread && <Badge tone="signal" className="shadow-sm">Nova</Badge>}
                    {notif.telegramStatus === "sent" && <Badge tone="info" className="shadow-sm">Telegram</Badge>}
                    {notif.telegramStatus === "error" && <Badge tone="danger" className="shadow-sm">Falha Telegram</Badge>}
                  </div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] whitespace-nowrap">
                    {formatRelativeTime(new Date(notif.createdAt))}
                  </div>
                </div>
                
                <p className={`mb-6 whitespace-pre-wrap text-sm leading-relaxed ${isUnread ? "text-[var(--carbon)] font-medium" : "text-[var(--muted)]"}`}>
                  {notif.summary}
                </p>
                
                <div className="flex flex-wrap items-center gap-3">
                  {notif.actionUrl && (
                    <Link href={notif.actionUrl} className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)]/50  px-4 py-2 text-xs font-bold text-[var(--text)] transition-all hover:border-[var(--signal)] hover:bg-[var(--signal)]/10 hover:text-[var(--signal)]">
                      <ExternalLink className="mr-2 size-3.5" />
                      Acessar registro
                    </Link>
                  )}
                  {isUnread && (
                    <form action={async () => { "use server"; await markNotificationAsRead(notif.id); }}>
                      <button type="submit" className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-[var(--muted)] transition-all hover:bg-[var(--soft)] hover:text-[var(--text)]">
                        <Check className="mr-2 size-3.5" />
                        Marcar como lida
                      </button>
                    </form>
                  )}
                  {notif.telegramStatus === "error" && (
                    <form action={async () => { "use server"; await resendNotification(notif.id); }}>
                      <button type="submit" className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-destructive transition-all hover:bg-destructive/10">
                        <RefreshCw className="mr-2 size-3.5" />
                        Tentar Telegram novamente
                      </button>
                    </form>
                  )}
                </div>
                
                {notif.telegramLastError && (
                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs font-medium text-destructive ">
                    <span className="font-bold flex items-center gap-2 mb-1"><AlertOctagon className="size-4" />Erro no Telegram</span>
                    {notif.telegramLastError}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
