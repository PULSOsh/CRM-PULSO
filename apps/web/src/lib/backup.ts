import { db, schema } from "@pulso/database";
import { is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

export async function createFullDatabaseBackup() {
  const backupData: Record<string, any[]> = {};
  
  // Iterate over all exported schema objects
  for (const [key, tableOrRelation] of Object.entries(schema)) {
    // Only dump actual tables
    if (is(tableOrRelation, PgTable)) {
      try {
        const rows = await db.select().from(tableOrRelation as any);
        backupData[key] = rows;
      } catch (err) {
        console.error(`Error backing up table ${key}`, err);
      }
    }
  }

  const payload = JSON.stringify({
    version: "1.0",
    timestamp: new Date().toISOString(),
    tables: backupData,
  });

  return payload;
}
