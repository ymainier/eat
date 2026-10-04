import { desc, eq } from "drizzle-orm";
import { createApplication } from "../application";
import { fixedClock } from "../application/clock";
import type { Database } from "../db/client";
import { emailOutbox, user } from "../db/schema";
import { outboxEmailSender } from "../email/outbox";
import { seedHousehold } from "../db/seed";
import type { HouseholdSettings } from "../domain/household";

export const allowedEmail = "member@example.com";

export function testApplication(
  db: Database,
  options: { now?: string; allowList?: string[] } = {},
) {
  return createApplication({
    db,
    clock: fixedClock(options.now ?? "2026-10-05T12:00:00Z"),
    emailSender: outboxEmailSender(db),
    allowList: options.allowList ?? [allowedEmail],
  });
}

/** The sign-in identity Better Auth would create on first sign-in. */
export async function createUser(db: Database, email = allowedEmail) {
  const id = crypto.randomUUID();
  await db.insert(user).values({ id, name: "", email, updatedAt: new Date() });
  return { id, email };
}

/** A Household with one signed-in Member. */
export async function signedInMember(
  db: Database,
  settings?: HouseholdSettings,
  email = allowedEmail,
) {
  await seedHousehold(db, settings);
  const app = testApplication(db, { allowList: [email] });
  const created = await createUser(db, email);
  await app.joinHousehold({ userId: created.id, email });
  const member = await app.findMember({ userId: created.id });
  if (!member) throw new Error("Member was not created");
  return member;
}

export async function emailsSentTo(db: Database, to: string) {
  return db
    .select()
    .from(emailOutbox)
    .where(eq(emailOutbox.to, to))
    .orderBy(desc(emailOutbox.createdAt));
}
