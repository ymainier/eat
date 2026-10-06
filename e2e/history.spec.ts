import { expect, test } from "./fixtures";

test("browse history and see a past Meal Week's eaten and not-eaten Meals", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/meal-weeks/2026-09-26");
  const count = page.getByLabel("Meals planned against the Meal Count");
  for (const [i, dishName] of ["Pizza", "Curry"].entries()) {
    await page.getByLabel("Dish").fill(dishName);
    await page.getByRole("button", { name: "Add Meal" }).click();
    await expect(count).toHaveText(`${i + 1} / 14`);
  }
  await page.getByRole("button", { name: "Pizza eaten" }).click();
  await expect(page.getByLabel("Meals eaten and left")).toHaveText("1 eaten · 1 left");

  await page.goto("/");
  await page.getByRole("link", { name: "History" }).click();
  const history = page.getByRole("list", { name: "Past Meal Weeks" });
  await expect(history.getByRole("listitem")).toHaveCount(1);
  await expect(history).toContainText("2 / 14");
  await expect(history).toContainText("1 eaten · 1 not eaten");

  await history.getByRole("link", { name: /Sat 26 Sept – Fri 2 Oct/ }).click();
  await expect(page.getByText("Past Meal Week")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pizza eaten" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Curry eaten" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
