import { db, schema } from "@pulso/database";
import { hashPublicToken } from "@pulso/database/tokens";
import { LocalPrivateStorage } from "@pulso/storage";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const storage = new LocalPrivateStorage();

/** Download do arquivo vinculado a uma aprovação, autenticado pelo mesmo par slug+token do link público
 * (nunca por sessão) -- só expõe o arquivo específico daquela aprovação, nada além disso. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token ausente." }, { status: 401 });

  const [approval] = await db.select().from(schema.approvals).where(eq(schema.approvals.publicSlug, slug)).limit(1);
  if (!approval || !approval.publicTokenHash || approval.publicTokenHash !== hashPublicToken(token)) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }
  if (!approval.fileId) return NextResponse.json({ error: "Nenhum arquivo vinculado a esta aprovação." }, { status: 404 });

  const [file] = await db.select().from(schema.files).where(eq(schema.files.id, approval.fileId)).limit(1);
  if (!file || file.trashedAt) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });

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
