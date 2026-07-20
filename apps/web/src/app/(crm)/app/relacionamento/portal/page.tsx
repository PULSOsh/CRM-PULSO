import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { listPortalUsers } from "./actions";

const statusLabel: Record<string, string> = { invited: "Convidado", active: "Ativo", revoked: "Revogado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "danger"> = { invited: "signal", active: "success", revoked: "danger" };

export default async function PortalUsersPage() {
  const users = await listPortalUsers();

  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Portal do cliente" description="Convites, acesso por projeto e revogação — sem cadastro público."
        actions={<Link href="/app/relacionamento/portal/novo" className="primary-button"><Plus className="size-4" />Convidar usuário</Link>} />

      <Card className="overflow-hidden">
        {users.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">Nenhum usuário de portal convidado ainda.</p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {users.map(({ portalUser, companyName }) => (
              <Link key={portalUser.id} href={`/app/relacionamento/portal/${portalUser.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--soft)]">
                <div>
                  <p className="font-bold">{portalUser.name} <span className="text-xs font-normal text-[var(--muted)]">{portalUser.email}</span></p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{companyName}</p>
                </div>
                <Badge tone={statusTone[portalUser.status]}>{statusLabel[portalUser.status] ?? portalUser.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
