import { test as base } from "@playwright/test";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { testUtils } from "better-auth/plugins";
import { createApplication } from "../src/application";
import { systemClock } from "../src/application/clock";
import { createDatabase, type Database } from "../src/db/client";
import * as schema from "../src/db/schema";
import { seedHousehold } from "../src/db/seed";
import { truncateAll } from "../src/db/testing";
import { outboxEmailSender } from "../src/email/outbox";
import {
  e2eAllowList,
  e2eAuthSecret,
  e2eBaseUrl,
  e2eDatabaseUrl,
  memberEmail,
} from "./environment";

type Fixtures = {
  db: Database;
  householdId: string;
  /** Signs a Member in by injecting a session cookie, skipping the email. */
  signIn: (email?: string) => Promise<void>;
};

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
  signIn: async ({ db, context }, use) => {
    const application = createApplication({
      db,
      clock: systemClock,
      emailSender: outboxEmailSender(db),
      allowList: e2eAllowList,
    });
    // Shares the app's database and secret, so its session cookies are valid there.
    const auth = betterAuth({
      baseURL: e2eBaseUrl,
      secret: e2eAuthSecret,
      database: drizzleAdapter(db, { provider: "pg", schema }),
      plugins: [testUtils()],
    });
    const helpers = (await auth.$context).test;

    await use(async (email = memberEmail) => {
      const user = await helpers.saveUser(helpers.createUser({ email }));
      await application.joinHousehold({ userId: user.id, email });
      await context.addCookies(
        await helpers.getCookies({ userId: user.id, domain: "localhost" }),
      );
    });
  },
});

export { expect } from "@playwright/test";
