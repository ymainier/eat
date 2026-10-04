import { expect, test } from "./fixtures";

test("mark Meals eaten and see the counts against the Meal Count", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/");
  const count = page.getByLabel("Meals planned against the Meal Count");
  for (const [i, dishName] of ["Pizza", "Curry", "Tacos"].entries()) {
    await page.getByLabel("Dish").fill(dishName);
    await page.getByRole("button", { name: "Add Meal" }).click();
    await expect(count).toHaveText(`${i + 1} / 14`);
  }
  const progress = page.getByLabel("Meals eaten and left");
  await expect(progress).toHaveText("0 eaten · 3 left");

  const curry = page.getByRole("button", { name: "Curry eaten" });
  await curry.click();
  await expect(curry).toHaveAttribute("aria-pressed", "true");
  await expect(progress).toHaveText("1 eaten · 2 left");
  await expect(count).toHaveText("3 / 14");

  await page.getByRole("button", { name: "Pizza eaten" }).click();
  await expect(progress).toHaveText("2 eaten · 1 left");

  // Undo a mis-tap.
  await curry.click();
  await expect(curry).toHaveAttribute("aria-pressed", "false");
  await expect(progress).toHaveText("1 eaten · 2 left");
});
