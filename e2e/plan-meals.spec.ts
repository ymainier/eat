import { dishes } from "../src/db/schema";
import { expect, test } from "./fixtures";

test("plan a Meal Week with a new Dish and an existing Dish", async ({
  page,
  signIn,
  db,
  householdId,
}) => {
  await db.insert(dishes).values({ householdId, name: "Spaghetti bolognese" });
  await signIn();
  await page.goto("/");

  const dish = page.getByLabel("Dish");
  const add = page.getByRole("button", { name: "Add Meal" });
  const pool = page.getByRole("list", { name: "Meals" }).getByRole("listitem");
  const count = page.getByLabel("Meals planned against the Meal Count");

  // An existing Dish, typed in a different case.
  await dish.fill("spaghetti BOLOGNESE");
  await add.click();
  await expect(pool).toContainText(["Spaghetti bolognese"]);
  await expect(count).toHaveText("1 / 14");

  // A new Dish, and a one-off Dish.
  await dish.fill("Chicken curry");
  await add.click();
  await expect(count).toHaveText("2 / 14");
  await dish.fill("Eat out");
  await add.click();
  await expect(pool).toContainText([
    "Spaghetti bolognese",
    "Chicken curry",
    "Eat out",
  ]);
  await expect(count).toHaveText("3 / 14");

  await page.getByRole("button", { name: "Remove Chicken curry" }).click();
  await expect(pool).toContainText(["Spaghetti bolognese", "Eat out"]);
  await expect(count).toHaveText("2 / 14");

  // Planned Meals are shared: they are still there on a new visit.
  await page.reload();
  await expect(pool).toHaveCount(2);
});
