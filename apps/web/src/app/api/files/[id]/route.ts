import { auth } from "@/lib/auth";
import { getPortalSession } from "@/lib/portal-auth";
import { db, schema } from "@pulso/database";
import { LocalPrivateStorage } from "@pulso/storage";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const storage = new LocalPrivateStorage();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [file] = await db.select().from(schema.files).where(eq(schema.files.id, id)).limit(1);
  if (!file || file.trashedAt) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    // Sem sessão interna: só serve se for um arquivo com visibilidade "client" vinculado a um
    // projeto ao qual o usuário do portal logado tem acesso concedido -- nunca por padrão.
    const portalUser = await getPortalSession();
    const authorized = portalUser && file.visibility === "client" && file.entityType === "project" && file.entityId
      ? await db.select().from(schema.portalPermissions)
          .where(and(eq(schema.portalPermissions.portalUserId, portalUser.id), eq(schema.portalPermissions.projectId, file.entityId)))
          .limit(1).then((r) => r.length > 0)
      : false;
    if (!authorized) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const bytes = await storage.read(file.storageKey);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
        "Cache-Control": "private, max-age=0, no-cache"
      }
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo." }, { status: 500 });
  }
}
