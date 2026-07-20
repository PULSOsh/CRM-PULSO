import { notFound } from "next/navigation";
import { Badge, Card } from "@pulso/ui";
import { PageHeader } from "@/components/page-header";
import { getPortalUser, listCompanyProjects, listPortalPermissions, regenerateInviteLink, revokePortalAccess } from "../actions";
import { LinkBox } from "./link-box";
import { ProjectAccessList } from "./project-access";

const statusLabel: Record<string, string> = { invited: "Convidado", active: "Ativo", revoked: "Revogado" };
const statusTone: Record<string, "neutral" | "signal" | "success" | "danger"> = { invited: "signal", active: "success", revoked: "danger" };

export default async function PortalUserDetailPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite_link_token?: string }>;
}) {
  const { id } = await params;
  const { invite_link_token } = await searchParams;

  const row = await getPortalUser(id);
  if (!row) notFound();
  const { portalUser, companyName, companyId } = row;

  const [projects, permissions] = await Promise.all([listCompanyProjects(companyId), listPortalPermissions(id)]);
  const grantedIds = permissions.map((p) => p.projectId);

  const freshLink = invite_link_token ? `/portal/ativar/${id}?token=${invite_link_token}` : null;

  return (
    <>
      <PageHeader eyebrow={companyName} title={portalUser.name} description={portalUser.email} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Acesso</h2>
            <Badge tone={statusTone[portalUser.status]}>{statusLabel[portalUser.status] ?? portalUser.status}</Badge>
          </div>

          {freshLink && (
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
              <p className="mb-2 text-xs font-bold text-[var(--signal)]">Link gerado agora — copie, não será mostrado de novo</p>
              <LinkBox link={freshLink} />
            </div>
          )}

          {portalUser.status === "invited" && !freshLink && (
            <form action={regenerateInviteLink.bind(null, portalUser.id)} className="mt-4">
              <button type="submit" className="secondary-button w-full justify-center text-xs">Regenerar link de convite</button>
            </form>
          )}

          {portalUser.status !== "revoked" && (
            <form action={revokePortalAccess.bind(null, portalUser.id)} className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
              <input name="reason" placeholder="Motivo da revogação" required className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--signal)]" />
              <button type="submit" className="w-full text-xs font-bold text-[var(--muted)] hover:text-[var(--error)]">Revogar acesso ao portal</button>
            </form>
          )}
          {portalUser.status === "revoked" && portalUser.revokedAt && (
            <p className="mt-4 text-xs text-[var(--muted)]">Revogado em {new Date(portalUser.revokedAt).toLocaleString("pt-BR")}.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Acesso por projeto</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Permissões podem variar por projeto — conceda apenas o necessário.</p>
          <div className="mt-4"><ProjectAccessList portalUserId={portalUser.id} projects={projects} grantedIds={grantedIds} /></div>
        </Card>
      </div>
    </>
  );
}
