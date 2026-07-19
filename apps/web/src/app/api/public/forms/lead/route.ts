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

  if (parsed.data.website) return NextResponse.json({ ok: true, protocol: "ignored" });

  return NextResponse.json({
    ok: true,
    protocol: `LEAD-${new Date().getFullYear()}-PREVIEW`,
    next: "O registro será encaminhado para qualificação."
  }, { status: 201 });
}
