import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function createDish(page: Page, name: string) {
  await page.getByLabel("New Dish").fill(name);
  await page.getByRole("button", { name: "Create Dish" }).click();
  await expect(
    page.getByRole("list", { name: "Dishes" }).getByRole("link", { name: new RegExp(`^${name}`) }),
  ).toBeVisible();
}

/** Tags a Dish from its page, starting from the catalogue. */
async function tagDish(page: Page, dish: string, tagName: string) {
  await page.goto("/dishes");
  await page
    .getByRole("list", { name: "Dishes" })
    .getByRole("link", { name: new RegExp(`^${dish}`) })
    .click();
  await page.getByLabel(`Add a Tag to ${dish}`).fill(tagName);
  await page.getByLabel(`Add a Tag to ${dish}`).press("Enter");
  await expect(
    page.getByRole("button", { name: `Remove Tag ${tagName} from ${dish}` }),
  ).toBeVisible();
}

test("filter the Dish catalogue by Tag", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/dishes");
  const catalogue = page.getByRole("list", { name: "Dishes" });

  for (const name of ["Carbonara", "Chicken curry", "Lasagne"]) await createDish(page, name);
  await tagDish(page, "Carbonara", "pasta");
  await tagDish(page, "Lasagne", "pasta");
  await tagDish(page, "Lasagne", "beef");
  await tagDish(page, "Chicken curry", "rice");

  await page.goto("/dishes");
  const filters = page.getByRole("navigation", { name: "Filter by Tag" });
  await filters.getByRole("link", { name: "pasta" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(2);
  await expect(catalogue).toContainText("Carbonara");
  await expect(catalogue).toContainText("Lasagne");

  await filters.getByRole("link", { name: "rice" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(1);
  await expect(catalogue).toContainText("Chicken curry");

  await filters.getByRole("link", { name: "All" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(3);
});

test("rename and delete a Tag across Dishes, and see Tags in the pool", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/dishes");
  for (const name of ["Carbonara", "Lasagne"]) await createDish(page, name);
  for (const name of ["Carbonara", "Lasagne"]) await tagDish(page, name, "pasta");

  await page.goto("/dishes");
  await page.getByRole("link", { name: "Manage Tags" }).click();
  await expect(page.getByRole("list", { name: "Tags" })).toContainText("2 Dishes");
  await page.getByLabel("Name of Tag pasta").fill("noodles");
  await page.getByRole("button", { name: "Rename Tag pasta" }).click();
  await expect(page.getByLabel("Name of Tag noodles")).toBeVisible();

  await page.goto("/");
  await page.getByLabel("Dish").fill("Carbonara");
  await page.getByRole("button", { name: "Add Meal" }).click();
  await expect(page.getByRole("list", { name: "Meals" })).toContainText("noodles");

  await page.goto("/tags");
  await page.getByRole("button", { name: "Delete Tag noodles" }).click();
  await expect(page.getByText("No Tags yet.")).toBeVisible();
});
