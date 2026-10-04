import { sql } from "drizzle-orm";
import type { Database } from "./client";

// Empties every application table, keeping the migrations journal.
export async function truncateAll(db: Database) {
  const rows = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await db.execute(sql.raw(`truncate table ${tables} restart identity cascade`));
}
