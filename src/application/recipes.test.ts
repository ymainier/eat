import { describe, expect, it } from "vitest";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import { DishNotFoundError } from "./dishes";
import { EmptyRecipeError, InvalidSourceUrlError } from "../domain/recipe";

const db = setUpTestDatabase();

async function setUp() {
  const member = await signedInMember(db);
  const app = testApplication(db);
  const dish = await app.createDish({ member, name: "Carbonara" });
  return { member, app, dish };
}

const carbonara = {
  ingredients: "200g spaghetti\n2 eggs\n100g guanciale",
  steps: "Boil the pasta.\nFry the guanciale.\nMix off the heat.",
  sourceUrl: "https://example.com/carbonara",
};

describe("Recipes", () => {
  it("sets a Recipe on a Dish", async () => {
    const { member, app, dish } = await setUp();
    await app.setRecipe({ member, dishId: dish.id, ...carbonara });

    expect(await app.getDish({ member, dishId: dish.id })).toMatchObject({
      name: "Carbonara",
      recipe: carbonara,
    });
  });

  it("keeps at most one Recipe per Dish: setting again replaces it", async () => {
    const { member, app, dish } = await setUp();
    await app.setRecipe({ member, dishId: dish.id, ...carbonara });
    await app.setRecipe({
      member,
      dishId: dish.id,
      ingredients: "spaghetti, eggs, pancetta",
      steps: "Same, with pancetta.",
      sourceUrl: "",
    });

    expect((await app.getDish({ member, dishId: dish.id })).recipe).toEqual({
      ingredients: "spaghetti, eggs, pancetta",
      steps: "Same, with pancetta.",
      sourceUrl: null,
    });
  });

  it("removes a Recipe, leaving the Dish as just a name", async () => {
    const { member, app, dish } = await setUp();
    await app.setRecipe({ member, dishId: dish.id, ...carbonara });
    await app.removeRecipe({ member, dishId: dish.id });

    expect(await app.getDish({ member, dishId: dish.id })).toMatchObject({
      name: "Carbonara",
      recipe: null,
    });
  });

  it("accepts only web addresses as source URL", async () => {
    const { member, app, dish } = await setUp();
    for (const sourceUrl of ["javascript:alert(1)", "not a url", "ftp://example.com"]) {
      await expect(
        app.setRecipe({ member, dishId: dish.id, ...carbonara, sourceUrl }),
      ).rejects.toBeInstanceOf(InvalidSourceUrlError);
    }
    expect((await app.getDish({ member, dishId: dish.id })).recipe).toBeNull();
  });

  it("refuses a Recipe with nothing in it", async () => {
    const { member, app, dish } = await setUp();
    await expect(
      app.setRecipe({ member, dishId: dish.id, ingredients: " ", steps: "\n", sourceUrl: "" }),
    ).rejects.toBeInstanceOf(EmptyRecipeError);
    expect((await app.getDish({ member, dishId: dish.id })).recipe).toBeNull();
  });

  it("shows which Dishes have a Recipe in the catalogue and the pool", async () => {
    const { member, app, dish } = await setUp();
    await app.createDish({ member, name: "Tacos" });
    await app.setRecipe({ member, dishId: dish.id, ...carbonara });
    await app.planMeal({ member, dishName: "Carbonara" });
    await app.planMeal({ member, dishName: "Tacos" });

    const catalogue = await app.listDishes({ member });
    expect(catalogue.map((d) => [d.name, d.hasRecipe])).toEqual([
      ["Carbonara", true],
      ["Tacos", false],
    ]);
    const pool = (await app.getCurrentMealWeek({ member })).meals;
    expect(pool.map((m) => [m.dish.name, m.dish.hasRecipe])).toEqual([
      ["Carbonara", true],
      ["Tacos", false],
    ]);
  });

  it("is scoped to the Household", async () => {
    const { member, app, dish } = await setUp();
    const stranger = { id: crypto.randomUUID(), householdId: crypto.randomUUID() };

    await expect(
      app.setRecipe({ member: stranger, dishId: dish.id, ...carbonara }),
    ).rejects.toBeInstanceOf(DishNotFoundError);
    await expect(app.getDish({ member: stranger, dishId: dish.id })).rejects.toBeInstanceOf(
      DishNotFoundError,
    );
    await expect(app.removeRecipe({ member: stranger, dishId: dish.id })).rejects.toBeInstanceOf(
      DishNotFoundError,
    );
    expect((await app.getDish({ member, dishId: dish.id })).recipe).toBeNull();
  });
});
