import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "pulso-crm",
    timestamp: new Date().toISOString(),
    timezone: "America/Fortaleza"
  });
}
