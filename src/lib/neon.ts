import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

/**
 * Returns a Neon serverless SQL client for the configured DATABASE_URL.
 * Uses a module-level singleton to avoid creating multiple clients per invocation.
 */
export function getNeonDb(): ReturnType<typeof neon> {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Configure it in .env.local for local development.");
    }
    sql = neon(url);
  }
  return sql;
}
