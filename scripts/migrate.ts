import "dotenv/config";
import { migrateDatabase } from "../src/db/migrate";

// On Vercel, only production deployments migrate: previews have no database.
const vercelEnv = process.env.VERCEL_ENV;
if (vercelEnv && vercelEnv !== "production") {
  console.log(`Skipping migrations on a ${vercelEnv} deployment.`);
  process.exit(0);
}

// In Vercel builds, prefer Neon's direct connection for schema changes.
const url =
  (process.env.VERCEL && process.env.DATABASE_URL_UNPOOLED) || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
await migrateDatabase(url);
console.log("Migrations applied.");
