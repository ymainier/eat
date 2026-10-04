import "dotenv/config";
import { migrateDatabase } from "../src/db/migrate";

await migrateDatabase(process.env.DATABASE_URL!);
console.log("Migrations applied.");
