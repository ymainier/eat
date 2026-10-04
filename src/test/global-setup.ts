import { migrateDatabase } from "../db/migrate";
import { testDatabaseUrl } from "./database";

export default async function setup() {
  await migrateDatabase(testDatabaseUrl);
}
