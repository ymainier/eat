import { expect, test } from "./fixtures";

test("change the start day: existing Meal Weeks are unchanged", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");
  await page.getByLabel("Dish").fill("Pizza");
  await page.getByRole("button", { name: "Add Meal" }).click();
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText("Sat 3 Oct – Fri 9 Oct");

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByText("Mon", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Monday" })).toBeChecked();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toHaveText("Settings saved.");
  await expect(page.getByText("from Mon 12 Oct")).toBeVisible();

  // The current Meal Week keeps its start and its Meals, and runs until the change.
  await page.goto("/");
  await expect(heading).toHaveText("Sat 3 Oct – Sun 11 Oct");
  await expect(page.getByRole("list", { name: "Meals" })).toContainText("Pizza");

  const weeks = page.getByRole("navigation", { name: "Meal Weeks" });
  await weeks.getByRole("link", { name: "Next Meal Week" }).click();
  await expect(heading).toHaveText("Mon 12 Oct – Sun 18 Oct");
  await weeks.getByRole("link", { name: "Previous Meal Week" }).click();
  await expect(heading).toHaveText("Sat 3 Oct – Sun 11 Oct");
  await weeks.getByRole("link", { name: "Previous Meal Week" }).click();
  await expect(heading).toHaveText("Sat 26 Sept – Fri 2 Oct");
});
