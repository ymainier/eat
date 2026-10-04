import { describe, expect, it } from "vitest";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import { DishNameTakenError, DishNotFoundError } from "./dishes";
import { DishNameRequiredError } from "../domain/dish";

const db = setUpTestDatabase();
// Monday 5 Oct 2026: the current Meal Week is Sat 3 – Fri 9 Oct.
const now = "2026-10-05T12:00:00Z";

async function setUp() {
  const member = await signedInMember(db);
  return { member, app: testApplication(db, { now }) };
}

const names = (dishes: { name: string }[]) => dishes.map((dish) => dish.name);

describe("Dish catalogue", () => {
  it("creates Dishes and lists them by name", async () => {
    const { member, app } = await setUp();
    await app.createDish({ member, name: "Tacos" });
    await app.createDish({ member, name: "  apple crumble " });

    expect(await app.listDishes({ member })).toEqual([
      expect.objectContaining({ name: "apple crumble", archived: false, lastPlannedIn: null }),
      expect.objectContaining({ name: "Tacos", archived: false, lastPlannedIn: null }),
    ]);
  });

  it("refuses a Dish whose name is already used, ignoring case", async () => {
    const { member, app } = await setUp();
    await app.createDish({ member, name: "Pizza" });

    await expect(app.createDish({ member, name: "PIZZA" })).rejects.toMatchObject({
      constructor: DishNameTakenError,
      byArchivedDish: false,
    });
    await expect(app.createDish({ member, name: " " })).rejects.toBeInstanceOf(
      DishNameRequiredError,
    );
    expect(names(await app.listDishes({ member }))).toEqual(["Pizza"]);
  });

  it("searches Dishes by name, ignoring case", async () => {
    const { member, app } = await setUp();
    for (const name of ["Chicken curry", "Lamb curry", "Pizza", "100% juice"]) {
      await app.createDish({ member, name });
    }

    expect(names(await app.listDishes({ member, search: "CURRY" }))).toEqual([
      "Chicken curry",
      "Lamb curry",
    ]);
    expect(names(await app.listDishes({ member, search: "%" }))).toEqual(["100% juice"]);
  });

  it("shows the start of the latest Meal Week each Dish was planned in", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: "2026-09-19" });
    await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: "2026-10-03" });
    await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: "2026-09-26" });
    await app.createDish({ member, name: "Tacos" });

    const dishes = await app.listDishes({ member });
    expect(dishes.map((d) => [d.name, d.lastPlannedIn])).toEqual([
      ["Pizza", "2026-10-03"],
      ["Tacos", null],
    ]);
  });
});

describe("rename a Dish", () => {
  it("changes its name in every Meal, past ones included", async () => {
    const { member, app } = await setUp();
    const meal = await app.planMeal({
      member,
      dishName: "Spag bol",
      mealWeekStartDate: "2026-09-26",
    });
    await app.planMeal({ member, dishName: "Spag bol" });

    await app.renameDish({ member, dishId: meal.dish.id, name: "Spaghetti bolognese" });

    const past = await app.getMealWeek({ member, startDate: "2026-09-26" });
    const current = await app.getCurrentMealWeek({ member });
    expect(names(past.meals.map((m) => m.dish))).toEqual(["Spaghetti bolognese"]);
    expect(names(current.meals.map((m) => m.dish))).toEqual(["Spaghetti bolognese"]);
  });

  it("can change only the case of its own name", async () => {
    const { member, app } = await setUp();
    const pizza = await app.createDish({ member, name: "pizza" });

    await app.renameDish({ member, dishId: pizza.id, name: "Pizza" });

    expect(names(await app.listDishes({ member }))).toEqual(["Pizza"]);
  });

  it("is refused when another Dish already has the name, ignoring case", async () => {
    const { member, app } = await setUp();
    await app.createDish({ member, name: "Pizza" });
    const tacos = await app.createDish({ member, name: "Tacos" });

    await expect(
      app.renameDish({ member, dishId: tacos.id, name: "pIzZa" }),
    ).rejects.toBeInstanceOf(DishNameTakenError);
    expect(names(await app.listDishes({ member }))).toEqual(["Pizza", "Tacos"]);
  });

  it("is refused for a Dish of another Household", async () => {
    const { member, app } = await setUp();
    const pizza = await app.createDish({ member, name: "Pizza" });
    const stranger = { id: crypto.randomUUID(), householdId: crypto.randomUUID() };

    await expect(
      app.renameDish({ member: stranger, dishId: pizza.id, name: "Mine" }),
    ).rejects.toBeInstanceOf(DishNotFoundError);
    await expect(
      app.renameDish({ member, dishId: "nope", name: "Mine" }),
    ).rejects.toBeInstanceOf(DishNotFoundError);
  });
});

describe("archive a Dish", () => {
  it("leaves it out of the catalogue and of planning suggestions", async () => {
    const { member, app } = await setUp();
    const pizza = await app.createDish({ member, name: "Pizza" });
    await app.createDish({ member, name: "Tacos" });

    await app.archiveDish({ member, dishId: pizza.id });

    expect(names(await app.listDishes({ member }))).toEqual(["Tacos"]);
    expect(await app.listDishes({ member, archived: true })).toEqual([
      expect.objectContaining({ name: "Pizza", archived: true }),
    ]);
  });

  it("keeps it in past Meal Weeks", async () => {
    const { member, app } = await setUp();
    const meal = await app.planMeal({
      member,
      dishName: "Pizza",
      mealWeekStartDate: "2026-09-26",
    });

    await app.archiveDish({ member, dishId: meal.dish.id });

    const past = await app.getMealWeek({ member, startDate: "2026-09-26" });
    expect(names(past.meals.map((m) => m.dish))).toEqual(["Pizza"]);
  });

  it("can be undone", async () => {
    const { member, app } = await setUp();
    const pizza = await app.createDish({ member, name: "Pizza" });
    await app.archiveDish({ member, dishId: pizza.id });

    await app.unarchiveDish({ member, dishId: pizza.id });

    expect(await app.listDishes({ member })).toEqual([
      expect.objectContaining({ name: "Pizza", archived: false }),
    ]);
    expect(await app.listDishes({ member, archived: true })).toEqual([]);
  });

  it("is brought back when a Member plans it by name", async () => {
    const { member, app } = await setUp();
    const pizza = await app.createDish({ member, name: "Pizza" });
    await app.archiveDish({ member, dishId: pizza.id });

    const meal = await app.planMeal({ member, dishName: "pizza" });

    expect(meal.dish.id).toBe(pizza.id);
    expect(names(await app.listDishes({ member }))).toEqual(["Pizza"]);
  });

  it("still refuses a new Dish with an Archived Dish's name", async () => {
    const { member, app } = await setUp();
    const pizza = await app.createDish({ member, name: "Pizza" });
    await app.archiveDish({ member, dishId: pizza.id });

    await expect(app.createDish({ member, name: "Pizza" })).rejects.toMatchObject({
      constructor: DishNameTakenError,
      byArchivedDish: true,
    });
    const tacos = await app.createDish({ member, name: "Tacos" });
    await expect(
      app.renameDish({ member, dishId: tacos.id, name: "pizza" }),
    ).rejects.toMatchObject({ byArchivedDish: true });
  });
});
