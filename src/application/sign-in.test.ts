import { describe, expect, it } from "vitest";
import { seedHousehold } from "../db/seed";
import { setUpTestDatabase } from "../test/database";
import {
  allowedEmail,
  createUser,
  emailsSentTo,
  testApplication,
} from "../test/application";
import { NotAllowedToSignInError } from "./sign-in";

const db = setUpTestDatabase();
const link = "http://localhost:3000/api/auth/magic-link/verify?token=abc";

describe("sign in", () => {
  it("allows only emails on the allow list, ignoring case and spaces", async () => {
    const app = testApplication(db, { allowList: [" Member@Example.com "] });
    expect(app.isAllowedToSignIn("MEMBER@example.COM")).toBe(true);
    expect(app.isAllowedToSignIn("stranger@example.com")).toBe(false);
  });

  it("emails the magic link to an allow-listed email", async () => {
    const app = testApplication(db);
    await app.sendSignInLink({ email: allowedEmail, url: link });

    const [email] = await emailsSentTo(db, allowedEmail);
    expect(email.subject).toBe("Sign in to Eat");
    expect(email.text).toContain(link);
  });

  it("sends nothing to an email that is not on the allow list", async () => {
    const app = testApplication(db);
    await expect(
      app.sendSignInLink({ email: "stranger@example.com", url: link }),
    ).rejects.toBeInstanceOf(NotAllowedToSignInError);
    expect(await emailsSentTo(db, "stranger@example.com")).toEqual([]);
  });

  it("makes a person a Member of the Household on first sign-in", async () => {
    const householdId = await seedHousehold(db);
    const app = testApplication(db);
    const { id: userId } = await createUser(db);

    expect(await app.findMember({ userId })).toBeNull();
    const member = await app.joinHousehold({ userId, email: allowedEmail });
    expect(member).toMatchObject({ householdId });
    expect(await app.findMember({ userId })).toEqual(member);
  });

  it("keeps the same Membership on later sign-ins", async () => {
    await seedHousehold(db);
    const app = testApplication(db);
    const { id: userId } = await createUser(db);

    await app.joinHousehold({ userId, email: allowedEmail });
    const first = await app.findMember({ userId });
    await app.joinHousehold({ userId, email: allowedEmail });
    expect(await app.findMember({ userId })).toEqual(first);
  });

  it("refuses Membership to an email that is not on the allow list", async () => {
    await seedHousehold(db);
    const app = testApplication(db);
    const { id: userId } = await createUser(db, "stranger@example.com");

    await expect(
      app.joinHousehold({ userId, email: "stranger@example.com" }),
    ).rejects.toBeInstanceOf(NotAllowedToSignInError);
    expect(await app.findMember({ userId })).toBeNull();
  });
});
