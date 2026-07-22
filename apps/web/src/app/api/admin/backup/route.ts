import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createFullDatabaseBackup } from "@/lib/backup";
import { recordAuditEvent } from "@pulso/database/audit";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const backupJson = await createFullDatabaseBackup();
    
    await recordAuditEvent({
      actorType: "user",
      actorId: session.user.id,
      action: "admin.backup.downloaded",
      entityType: "system",
      entityId: "backup"
    });

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `pulso-crm-backup-${dateStr}.json`;

    return new NextResponse(backupJson, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    console.error("Backup error", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
