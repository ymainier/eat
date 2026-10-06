import { desc, eq } from "drizzle-orm";
import { emailOutbox } from "../src/db/schema";
import type { Database } from "../src/db/client";
import { expect, test } from "./fixtures";
import { memberEmail } from "./environment";

async function emailsTo(db: Database, to: string) {
  return db
    .select()
    .from(emailOutbox)
    .where(eq(emailOutbox.to, to))
    .orderBy(desc(emailOutbox.createdAt));
}

test("an allow-listed person signs in with a magic link, then signs out", async ({
  page,
  db,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/sign-in");

  await page.getByLabel("Email").fill(memberEmail);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");

  const [email] = await emailsTo(db, memberEmail);
  const link = email.text.match(/https?:\/\/\S+/)?.[0];
  expect(link).toBeDefined();
  await page.goto(link!);

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Sat 3 Oct – Fri 9 Oct" })).toBeVisible();

  // The session survives a new visit.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sat 3 Oct – Fri 9 Oct" })).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");
  await page.goto("/");
  await expect(page).toHaveURL("/sign-in");
});

test("an email that is not on the allow list is told it can't sign in", async ({
  page,
  db,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("stranger@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();

  await expect(page.getByText(/can.t sign in to Eat/)).toBeVisible();
  expect(await emailsTo(db, "stranger@example.com")).toEqual([]);
});

test("a sign-in link that was already used is refused with a clear message", async ({
  page,
  db,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  const [email] = await emailsTo(db, memberEmail);
  const link = email.text.match(/https?:\/\/\S+/)![0];

  await page.goto(link);
  await expect(page).toHaveURL("/");
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");

  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-in\?error=/);
  await expect(page.getByText(/link didn.t work/)).toBeVisible();
});
