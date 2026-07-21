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
  await db.update(schema.appSettings)
    .set({
      legalName: data.legalName,
      document: data.document,
      address: data.address,
      email: data.email,
    })
    .where(eq(schema.appSettings.id, "singleton"));
    
  revalidatePath("/app/configuracoes/geral");
}

export async function updateIdentitySettings(data: {
  primaryColor: string;
  logoUrl: string;
  logoUrlLight: string;
}) {
  await db.update(schema.appSettings)
    .set({
      primaryColor: data.primaryColor,
      logoUrl: data.logoUrl,
      logoUrlLight: data.logoUrlLight,
    })
    .where(eq(schema.appSettings.id, "singleton"));
    
  revalidatePath("/app/configuracoes/geral");
}
