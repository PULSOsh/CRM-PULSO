import { auth } from "@/lib/auth";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { LocalPrivateStorage } from "@pulso/storage";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const storage = new LocalPrivateStorage();

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 422 });
  }

  const entityType = String(formData?.get("entityType") ?? "") || null;
  const entityId = String(formData?.get("entityId") ?? "") || null;
  const visibility = formData?.get("visibility") === "client" ? "client" : "internal";

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const stored = await storage.put({ bytes, originalName: file.name, mimeType: file.type || "application/octet-stream" });

    const [record] = await db.insert(schema.files).values({
      originalName: stored.originalName,
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      sha256: stored.sha256,
      visibility,
      entityType,
      entityId
    }).returning();

    await recordAuditEvent({
      actorType: "user", action: "file.uploaded", entityType: "file", entityId: record.id,
      after: { originalName: record.originalName, sizeBytes: record.sizeBytes, entityType, entityRef: entityId }
    });

    return NextResponse.json({ id: record.id, originalName: record.originalName, sizeBytes: record.sizeBytes, mimeType: record.mimeType }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o arquivo.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
