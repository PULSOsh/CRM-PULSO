import { sql } from "drizzle-orm";
import { db } from "./index";
import { counters } from "./schema";

/** Incremento atômico via INSERT..ON CONFLICT (seguro sob concorrência, sem lock explícito). */
export async function nextSequence(namespace: string, year: number): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ namespace, year, value: 1 })
    .onConflictDoUpdate({
      target: [counters.namespace, counters.year],
      set: { value: sql`${counters.value} + 1` },
    })
    .returning({ value: counters.value });

  return row.value;
}
