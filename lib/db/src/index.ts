import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,  // wait up to 15s to acquire a connection
  idleTimeoutMillis: 10000,        // release idle connections quickly
  max: 4,                          // keep pool very small to avoid connection exhaustion
});
export const db = drizzle(pool, { schema });

export * from "./schema";
