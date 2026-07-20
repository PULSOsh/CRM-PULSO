import { db, schema } from "@pulso/database";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Mail, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { markAllNotificationsAsRead, markNotificationAsRead, resendNotification } from "./actions";

export default async function NotificacoesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const showUnreadOnly = filter !== "all";

  const notifications = await db.query.adminNotifications.findMany({
    where: showUnreadOnly ? eq(schema.adminNotifications.isRead, false) : undefined,
    orderBy: [desc(schema.adminNotifications.createdAt)],
    limit: 100,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Central de Notificações"
        description="Acompanhe alertas administrativos e de eventos do sistema"
      >
        <div className="flex gap-2">
          <Button asChild variant={showUnreadOnly ? "outline" : "default"}>
            <Link href="/app/inteligencia/notificacoes?filter=all">Todas</Link>
          </Button>
          <Button asChild variant={showUnreadOnly ? "default" : "outline"}>
            <Link href="/app/inteligencia/notificacoes">Não lidas</Link>
          </Button>
          <form action={markAllNotificationsAsRead}>
            <Button variant="secondary" type="submit">
              <Check className="w-4 h-4 mr-2" />
              Marcar lidas
            </Button>
          </form>
        </div>
      </PageHeader>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground">
              Você está em dia com os alertas do sistema.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 border rounded-lg transition-colors ${notif.isRead ? "bg-background" : "bg-primary/5 border-primary/20"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-lg">{notif.title}</h4>
                  {!notif.isRead && <Badge>Nova</Badge>}
                  {notif.telegramStatus === "sent" && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Telegram</Badge>}
                  {notif.telegramStatus === "error" && <Badge variant="destructive">Falha Telegram</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                </div>
              </div>
              <p className="text-sm mb-4 whitespace-pre-wrap">{notif.summary}</p>
              
              <div className="flex items-center gap-2">
                {notif.actionUrl && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={notif.actionUrl}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Acessar
                    </Link>
                  </Button>
                )}
                {!notif.isRead && (
                  <form action={markNotificationAsRead.bind(null, notif.id)}>
                    <Button variant="ghost" size="sm" type="submit">
                      <Check className="w-4 h-4 mr-2" />
                      Marcar como lida
                    </Button>
                  </form>
                )}
                {notif.telegramStatus === "error" && (
                  <form action={resendNotification.bind(null, notif.id)}>
                    <Button variant="ghost" size="sm" type="submit" className="text-destructive">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Telegram novamente
                    </Button>
                  </form>
                )}
              </div>
              
              {notif.telegramLastError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20">
                  <span className="font-semibold">Erro no Telegram:</span> {notif.telegramLastError}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
