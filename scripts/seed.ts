import "dotenv/config";
import { createDatabase } from "../src/db/client";
import { seedHousehold } from "../src/db/seed";

const { db, close } = createDatabase(process.env.DATABASE_URL!);
const id = await seedHousehold(db);
await close();
console.log(`Household ${id} ready.`);
