import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";
import { ActivateForm } from "./activate-form";

export default async function ActivatePortalUserPage({
  params, searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const [portalUser] = await db.select().from(schema.portalUsers).where(eq(schema.portalUsers.id, id)).limit(1);

  if (!portalUser || !token || portalUser.status !== "invited") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold">Convite inválido ou já usado</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Peça um novo convite à PULSO.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-10">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">Portal do cliente</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">Olá, {portalUser.name}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Defina sua senha para ativar o acesso.</p>
      <ActivateForm portalUserId={portalUser.id} token={token} />
    </main>
  );
}
