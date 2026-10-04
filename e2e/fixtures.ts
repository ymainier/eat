import { test as base } from "@playwright/test";
import { createDatabase, type Database } from "../src/db/client";
import { seedHousehold } from "../src/db/seed";
import { truncateAll } from "../src/db/testing";
import { e2eDatabaseUrl } from "./environment";

type Fixtures = { db: Database; householdId: string };

/** Every test starts from an empty database holding only the seeded Household. */
export const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    const { db, close } = createDatabase(e2eDatabaseUrl);
    await truncateAll(db);
    await use(db);
    await close();
  },
  householdId: [
    async ({ db }, use) => {
      await use(await seedHousehold(db));
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
