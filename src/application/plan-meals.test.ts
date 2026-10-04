import { describe, expect, it } from "vitest";
import { households } from "../db/schema";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import { DishNameRequiredError, MealNotFoundError } from "./plan-meals";

const db = setUpTestDatabase();
// Monday 5 Oct 2026, in the Meal Week Sat 3 – Fri 9 Oct.
const now = "2026-10-05T12:00:00Z";

async function setUp() {
  const member = await signedInMember(db);
  const app = testApplication(db, { now });
  return { member, app };
}

const dishNames = (week: { meals: { dish: { name: string } }[] }) =>
  week.meals.map((meal) => meal.dish.name);

describe("plan Meals in the current Meal Week", () => {
  it("adds a Meal with a new Dish to the pool", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Spaghetti bolognese" });

    const week = await app.getCurrentMealWeek({ member });
    expect(dishNames(week)).toEqual(["Spaghetti bolognese"]);
    expect(week.plannedMealCount).toBe(1);
    expect((await app.listDishes({ member })).map((d) => d.name)).toEqual([
      "Spaghetti bolognese",
    ]);
  });

  it("reuses an existing Dish when the name matches ignoring case and surrounding spaces", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Spaghetti bolognese" });
    await app.planMeal({ member, dishName: "  spaghetti BOLOGNESE " });

    const week = await app.getCurrentMealWeek({ member });
    expect(dishNames(week)).toEqual(["Spaghetti bolognese", "Spaghetti bolognese"]);
    expect(week.meals[0].dish.id).toBe(week.meals[1].dish.id);
    expect(await app.listDishes({ member })).toHaveLength(1);
  });

  it("treats one-off Dishes like any other Dish", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Leftovers" });
    await app.planMeal({ member, dishName: "Eat out" });

    const week = await app.getCurrentMealWeek({ member });
    expect(dishNames(week)).toEqual(["Leftovers", "Eat out"]);
    expect(week.plannedMealCount).toBe(2);
  });

  it("refuses a Meal without a Dish name", async () => {
    const { member, app } = await setUp();
    await expect(app.planMeal({ member, dishName: "   " })).rejects.toBeInstanceOf(
      DishNameRequiredError,
    );
    expect((await app.getCurrentMealWeek({ member })).meals).toEqual([]);
  });

  it("allows planning more Meals than the Meal Count", async () => {
    const member = await signedInMember(db, {
      startDay: 6,
      mealCount: 2,
      timezone: "Europe/London",
    });
    const app = testApplication(db, { now });
    for (const dishName of ["Pizza", "Curry", "Tacos"]) {
      await app.planMeal({ member, dishName });
    }

    const week = await app.getCurrentMealWeek({ member });
    expect(week).toMatchObject({ plannedMealCount: 3, mealCount: 2 });
  });

  it("removes a planned Meal", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });
    await app.planMeal({ member, dishName: "Curry" });
    const [pizza] = (await app.getCurrentMealWeek({ member })).meals;

    await app.removeMeal({ member, mealId: pizza.id });

    const week = await app.getCurrentMealWeek({ member });
    expect(dishNames(week)).toEqual(["Curry"]);
    expect(week.plannedMealCount).toBe(1);
    // The Dish stays in the catalogue.
    expect(await app.listDishes({ member })).toHaveLength(2);
  });

  it("reports a Meal that no longer exists, or never did, as not found", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });
    const [pizza] = (await app.getCurrentMealWeek({ member })).meals;
    await app.removeMeal({ member, mealId: pizza.id });

    await expect(app.removeMeal({ member, mealId: pizza.id })).rejects.toBeInstanceOf(
      MealNotFoundError,
    );
    await expect(app.removeMeal({ member, mealId: "null" })).rejects.toBeInstanceOf(
      MealNotFoundError,
    );
  });

  it("does not remove a Meal of another Household", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });
    const [pizza] = (await app.getCurrentMealWeek({ member })).meals;
    const stranger = { id: crypto.randomUUID(), householdId: crypto.randomUUID() };

    await expect(
      app.removeMeal({ member: stranger, mealId: pizza.id }),
    ).rejects.toBeInstanceOf(MealNotFoundError);
    expect((await app.getCurrentMealWeek({ member })).meals).toHaveLength(1);
  });
});

describe("Meal Week creation", () => {
  // Until Household settings exist (#11), the setting is changed directly.
  const changeMealCount = (mealCount: number) =>
    db.update(households).set({ mealCount });

  it("copies the Household's Meal Count when its first Meal is planned", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });
    await changeMealCount(20);

    expect((await app.getCurrentMealWeek({ member })).mealCount).toBe(14);
  });

  it("does not exist before its first Meal, so it follows the current setting", async () => {
    const { member, app } = await setUp();
    await changeMealCount(20);

    expect((await app.getCurrentMealWeek({ member })).mealCount).toBe(20);
  });
});
