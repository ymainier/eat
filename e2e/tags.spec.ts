import { expect, test } from "./fixtures";

test("filter the Dish catalogue by Tag", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/dishes");
  const catalogue = page.getByRole("list", { name: "Dishes" });

  for (const name of ["Carbonara", "Chicken curry", "Lasagne"]) {
    await page.getByLabel("New Dish").fill(name);
    await page.getByRole("button", { name: "Create Dish" }).click();
    await expect(page.getByLabel(`Name of ${name}`)).toBeVisible();
  }
  const tag = async (dish: string, tagName: string) => {
    await page.getByLabel(`Add a Tag to ${dish}`).fill(tagName);
    await page.getByLabel(`Add a Tag to ${dish}`).press("Enter");
    await expect(
      page.getByRole("button", { name: `Remove Tag ${tagName} from ${dish}` }),
    ).toBeVisible();
  };
  await tag("Carbonara", "pasta");
  await tag("Lasagne", "pasta");
  await tag("Lasagne", "beef");
  await tag("Chicken curry", "rice");

  const filters = page.getByRole("navigation", { name: "Filter by Tag" });
  await filters.getByRole("link", { name: "pasta" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(2);
  await expect(page.getByLabel("Name of Carbonara")).toBeVisible();
  await expect(page.getByLabel("Name of Lasagne")).toBeVisible();

  await filters.getByRole("link", { name: "rice" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByLabel("Name of Chicken curry")).toBeVisible();

  await filters.getByRole("link", { name: "All" }).click();
  await expect(catalogue.getByRole("listitem")).toHaveCount(3);
});

test("rename and delete a Tag across Dishes, and see Tags in the pool", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/dishes");
  for (const name of ["Carbonara", "Lasagne"]) {
    await page.getByLabel("New Dish").fill(name);
    await page.getByRole("button", { name: "Create Dish" }).click();
    await page.getByLabel(`Add a Tag to ${name}`).fill("pasta");
    await page.getByLabel(`Add a Tag to ${name}`).press("Enter");
    await expect(
      page.getByRole("button", { name: `Remove Tag pasta from ${name}` }),
    ).toBeVisible();
  }

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
