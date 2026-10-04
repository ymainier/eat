import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./client";

export async function migrateDatabase(url: string) {
  const { db, close } = createDatabase(url);
  try {
    await migrate(db, {
      migrationsFolder: path.join(import.meta.dirname, "../../drizzle"),
    });
  } finally {
    await close();
  }
}
