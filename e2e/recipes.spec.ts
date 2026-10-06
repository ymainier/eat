import { expect, test } from "./fixtures";

test("edit a Recipe and open it from a Meal", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");
  await page.getByLabel("Dish").fill("Carbonara");
  await page.getByRole("button", { name: "Add Meal" }).click();
  await expect(page.getByLabel("Meals planned against the Meal Count")).toHaveText("1 / 14");
  await expect(page.getByRole("link", { name: "Recipe for Carbonara" })).toHaveCount(0);

  await page.getByRole("link", { name: "Dishes" }).click();
  await page.getByRole("list", { name: "Dishes" }).getByRole("link", { name: /^Carbonara/ }).click();
  await expect(page.getByRole("heading", { name: "Carbonara" })).toBeVisible();

  await page.getByLabel("Ingredients").fill("200g spaghetti\n2 eggs");
  await page.getByLabel("Steps").fill("Boil the pasta.");
  await page.getByLabel("Source URL (optional)").fill("not a url");
  await page.getByRole("button", { name: "Save Recipe" }).click();
  await expect(page.getByText("The source URL must be a web address")).toBeVisible();
  await expect(page.getByLabel("Ingredients")).toHaveValue("200g spaghetti\n2 eggs");

  await page.getByLabel("Source URL (optional)").fill("https://example.com/carbonara");
  await page.getByRole("button", { name: "Save Recipe" }).click();
  const recipe = page.getByRole("article", { name: "Recipe" });
  await expect(recipe).toContainText("2 eggs");
  await expect(recipe.getByRole("link", { name: "Original recipe" })).toHaveAttribute(
    "href",
    "https://example.com/carbonara",
  );

  // Edit it.
  await page.getByText("Edit Recipe").click();
  await page.getByLabel("Steps").fill("Boil the pasta.\nMix with the eggs off the heat.");
  await page.getByRole("button", { name: "Save Recipe" }).click();
  await expect(recipe).toContainText("Mix with the eggs off the heat.");

  // Open it from the Meal in the pool.
  await page.goto("/");
  await page.getByRole("link", { name: "Recipe for Carbonara" }).click();
  await expect(recipe).toContainText("Mix with the eggs off the heat.");

  await page.getByRole("button", { name: "Remove Recipe" }).click();
  await expect(page.getByText("No Recipe yet.")).toBeVisible();
});
