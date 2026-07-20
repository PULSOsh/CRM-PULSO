import { NextResponse } from "next/server";
import { db } from "@pulso/database";
import { leads, contacts, opportunities } from "@pulso/database/schema";

export async function POST() {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 });
  }

  try {
    // Basic seed for demo
    await db.insert(leads).values([
      { code: "LD-DEMO-1", name: "Empresa Alpha", email: "contato@alpha.com", source: "site", status: "new" },
      { code: "LD-DEMO-2", name: "Beta Tech", phone: "11999999999", source: "whatsapp", status: "qualifying" }
    ]).onConflictDoNothing();

    return NextResponse.json({ success: true, message: "Demo data seeded successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}
