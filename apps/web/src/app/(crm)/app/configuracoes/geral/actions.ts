"use server";

import { db, schema } from "@pulso/database";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateGeralSettings(data: {
  legalName: string;
  document: string;
  address: string;
  email: string;
}) {
  const [existing] = await db.select({ id: schema.appSettings.id }).from(schema.appSettings).where(eq(schema.appSettings.id, "singleton")).limit(1);

  if (existing) {
    await db.update(schema.appSettings)
      .set({
        legalName: data.legalName,
        document: data.document,
        address: data.address,
        email: data.email,
        updatedAt: new Date()
      })
      .where(eq(schema.appSettings.id, "singleton"));
  } else {
    await db.insert(schema.appSettings).values({
      id: "singleton",
      legalName: data.legalName,
      document: data.document,
      address: data.address,
      email: data.email,
      primaryColor: "#FF5500"
    });
  }
    
  revalidatePath("/app/configuracoes/geral");
}

export async function updateIdentitySettings(data: {
  primaryColor: string;
  logoUrl: string;
  logoUrlLight: string;
}) {
  const [existing] = await db.select({ id: schema.appSettings.id }).from(schema.appSettings).where(eq(schema.appSettings.id, "singleton")).limit(1);

  if (existing) {
    await db.update(schema.appSettings)
      .set({
        primaryColor: data.primaryColor,
        logoUrl: data.logoUrl,
        logoUrlLight: data.logoUrlLight,
        updatedAt: new Date()
      })
      .where(eq(schema.appSettings.id, "singleton"));
  } else {
    await db.insert(schema.appSettings).values({
      id: "singleton",
      primaryColor: data.primaryColor,
      logoUrl: data.logoUrl,
      logoUrlLight: data.logoUrlLight
    });
  }
    
  revalidatePath("/app/configuracoes/geral");
}
