import { expect, test } from "./fixtures";

test("archive a Dish: it leaves autocomplete and remains in history", async ({
  page,
  signIn,
}) => {
  await signIn();
  // Pizza was planned in the previous Meal Week.
  await page.goto("/meal-weeks/2026-09-26");
  await page.getByLabel("Dish").fill("Pizza");
  await page.getByRole("button", { name: "Add Meal" }).click();
  await expect(page.getByLabel("Meals planned against the Meal Count")).toHaveText("1 / 14");

  await page.goto("/");
  const suggestions = page.locator("datalist#dish-names option");
  await expect(suggestions).toHaveCount(1);
  await expect(suggestions).toHaveAttribute("value", "Pizza");

  await page.getByRole("link", { name: "Dishes" }).click();
  const catalogue = page.getByRole("list", { name: "Dishes" });
  await expect(catalogue).toContainText("Last planned in the Meal Week of Sat 26 Sept");
  await catalogue.getByRole("button", { name: "Archive Pizza" }).click();
  await expect(page.getByText("No Dishes found.")).toBeVisible();

  await page.getByRole("link", { name: "Show Archived Dishes" }).click();
  await expect(catalogue.getByRole("button", { name: "Unarchive Pizza" })).toBeVisible();

  // Gone from planning suggestions…
  await page.goto("/");
  await expect(suggestions).toHaveCount(0);
  // …but still in history.
  await page.goto("/history");
  await page.getByRole("link", { name: /Sat 26 Sept/ }).click();
  await expect(page.getByRole("list", { name: "Meals" })).toContainText("Pizza");
});

test("create, rename and search Dishes", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/dishes");
  const create = page.getByRole("button", { name: "Create Dish" });
  const catalogue = page.getByRole("list", { name: "Dishes" });

  for (const name of ["Spag bol", "Chicken curry"]) {
    await page.getByLabel("New Dish").fill(name);
    await create.click();
    await expect(page.getByLabel(`Name of ${name}`)).toHaveValue(name);
  }
  await page.getByLabel("New Dish").fill("chicken CURRY");
  await create.click();
  await expect(
    page.getByText('There is already a Dish called "chicken CURRY".'),
  ).toBeVisible();
  await expect(page.getByLabel("New Dish")).toHaveValue("chicken CURRY");

  await page.getByLabel("Name of Spag bol").fill("Spaghetti bolognese");
  await page.getByRole("button", { name: "Rename Spag bol" }).click();
  await expect(page.getByLabel("Name of Spaghetti bolognese")).toBeVisible();

  await page.getByLabel("Search Dishes").fill("spag");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByLabel("Name of Spaghetti bolognese")).toBeVisible();
});
