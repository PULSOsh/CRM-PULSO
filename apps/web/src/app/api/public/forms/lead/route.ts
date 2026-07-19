import { formatRecordCode } from "@/lib/code";
import { db, schema } from "@pulso/database";
import { recordAuditEvent } from "@pulso/database/audit";
import { nextSequence } from "@pulso/database/counters";
import { NextResponse } from "next/server";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().min(8).max(32),
  company: z.string().trim().max(160).optional(),
  service: z.string().trim().max(160).optional(),
  message: z.string().trim().max(4000).optional(),
  consent: z.literal(true),
  utm: z.record(z.string(), z.string()).optional(),
  website: z.string().max(0).optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Revise os campos enviados.", errors: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Honeypot: bots preenchem campos ocultos. Responde como sucesso sem persistir nada.
  if (parsed.data.website) return NextResponse.json({ ok: true, protocol: "ignored" });

  const year = new Date().getFullYear();
  const sequence = await nextSequence("lead", year);
  const code = formatRecordCode("lead", year, sequence);

  const [lead] = await db.insert(schema.leads).values({
    code,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone,
    companyName: parsed.data.company || null,
    service: parsed.data.service || null,
    source: "site",
    message: parsed.data.message || null,
    status: "new",
    utm: parsed.data.utm ?? {}
  }).returning();

  await recordAuditEvent({
    actorType: "anonymous",
    action: "lead.created_public",
    entityType: "lead",
    entityId: lead.id,
    after: { code: lead.code },
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({
    ok: true,
    protocol: lead.code,
    next: "O registro será encaminhado para qualificação."
  }, { status: 201 });
}
