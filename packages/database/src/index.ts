import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pulsoPool?: Pool };

export const pool =
  globalForDb.pulsoPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://pulso:pulso@localhost:5432/pulso_crm",
    max: process.env.NODE_ENV === "production" ? 20 : 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pulsoPool = pool;

export const db = drizzle({ client: pool, schema });
export { schema };
