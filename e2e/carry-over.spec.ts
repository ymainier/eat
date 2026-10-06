import { expect, test } from "./fixtures";

test("carry over some uneaten Meals; the rest stay not eaten", async ({ page, signIn }) => {
  await signIn();

  // Plan the previous Meal Week and eat one Meal of it.
  await page.goto("/meal-weeks/2026-09-26");
  const count = page.getByLabel("Meals planned against the Meal Count");
  for (const [i, dishName] of ["Pizza", "Curry", "Tacos"].entries()) {
    await page.getByLabel("Dish").fill(dishName);
    await page.getByRole("button", { name: "Add Meal" }).click();
    await expect(count).toHaveText(`${i + 1} / 14`);
  }
  await page.getByRole("button", { name: "Pizza eaten" }).click();
  await expect(page.getByLabel("Meals eaten and left")).toHaveText("1 eaten · 2 left");

  // The current Meal Week offers the uneaten ones.
  await page.goto("/");
  const prompt = page.getByRole("region", { name: "Carry Over" });
  await expect(prompt.getByRole("checkbox")).toHaveCount(2);
  await prompt.getByRole("checkbox", { name: "Curry" }).uncheck();
  await prompt.getByRole("button", { name: "Carry Over" }).click();

  await expect(prompt).toBeHidden();
  await expect(page.getByRole("list", { name: "Meals" }).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("list", { name: "Meals" })).toContainText("Tacos");
  await expect(count).toHaveText("1 / 14");

  // The prompt doesn't come back, and Curry stayed behind, not eaten.
  await page.reload();
  await expect(prompt).toBeHidden();
  await page.goto("/meal-weeks/2026-09-26");
  const previousPool = page.getByRole("list", { name: "Meals" });
  await expect(previousPool.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Curry eaten" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("dismiss Carry Over", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/meal-weeks/2026-09-26");
  await page.getByLabel("Dish").fill("Pizza");
  await page.getByRole("button", { name: "Add Meal" }).click();
  await expect(page.getByLabel("Meals planned against the Meal Count")).toHaveText("1 / 14");

  await page.goto("/");
  const prompt = page.getByRole("region", { name: "Carry Over" });
  await prompt.getByRole("button", { name: "Skip" }).click();
  await expect(prompt).toBeHidden();
  await expect(page.getByText("No Meals planned yet.")).toBeVisible();
});
