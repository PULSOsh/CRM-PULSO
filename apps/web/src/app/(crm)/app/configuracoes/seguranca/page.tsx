"use client";

import { authClient } from "@/lib/auth-client";
import { PageHeader } from "@/components/page-header";
import { Badge, Card } from "@pulso/ui";
import { LogOut, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionRow = { id: string; token: string; createdAt: string | Date; userAgent?: string | null; ipAddress?: string | null };

export default function SecurityPage() {
  const router = useRouter();
  const { data: current } = authClient.useSession();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    authClient.listSessions().then(({ data }) => {
      setSessions((data as SessionRow[] | null) ?? []);
      setLoading(false);
    });
  }, []);

  async function handleRevokeAll() {
    setRevoking(true);
    await authClient.revokeSessions();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Configurações"
        title="Segurança"
        description="Sessões ativas e controle de acesso da sua conta."
        actions={
          <button className="secondary-button" onClick={handleRevokeAll} disabled={revoking}>
            <LogOut className="size-4" />{revoking ? "Encerrando..." : "Sair de todos os dispositivos"}
          </button>
        }
      />
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="font-extrabold">Sessões ativas</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Dispositivos com acesso à sua conta neste momento.</p>
        </div>
        {loading && <p className="p-5 text-sm text-[var(--muted)]">Carregando...</p>}
        {!loading && sessions.length === 0 && <p className="p-5 text-sm text-[var(--muted)]">Nenhuma sessão encontrada.</p>}
        {sessions.map((s) => (
          <div key={s.id} className="flex items-start gap-4 border-b border-[var(--line)] p-5 last:border-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)]"><Monitor className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold">{s.userAgent ?? "Dispositivo desconhecido"}</p>
                {s.token === current?.session.token && <Badge tone="success">Sessão atual</Badge>}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">IP {s.ipAddress ?? "não registrado"} · desde {new Date(s.createdAt).toLocaleString("pt-BR")}</p>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
