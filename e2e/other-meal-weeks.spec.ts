import { expect, test } from "./fixtures";

test("plan the next Meal Week while the current one is running", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  const weeks = page.getByRole("navigation", { name: "Meal Weeks" });
  const count = page.getByLabel("Meals planned against the Meal Count");

  await weeks.getByRole("link", { name: "Next →" }).click();
  await expect(heading).toHaveText("Sat 10 Oct – Fri 16 Oct");
  await expect(page.getByText("Future Meal Week")).toBeVisible();
  await expect(page.getByText("No Meals planned yet.")).toBeVisible();

  await page.getByLabel("Dish").fill("Roast chicken");
  await page.getByRole("button", { name: "Add Meal" }).click();
  await expect(count).toHaveText("1 / 14");

  await weeks.getByRole("link", { name: "Current Meal Week" }).click();
  await expect(heading).toHaveText("Sat 3 Oct – Fri 9 Oct");
  await expect(count).toHaveText("0 / 14");

  await weeks.getByRole("link", { name: "← Previous" }).click();
  await expect(heading).toHaveText("Sat 26 Sept – Fri 2 Oct");
  await expect(page.getByText("Past Meal Week")).toBeVisible();

  await page.goto("/meal-weeks/2026-10-10");
  await expect(page.getByRole("list", { name: "Meals" })).toContainText("Roast chicken");
});

test("a date that does not start a Meal Week is not found", async ({ page, signIn }) => {
  await signIn();
  const response = await page.goto("/meal-weeks/2026-10-06");
  expect(response?.status()).toBe(404);
});
