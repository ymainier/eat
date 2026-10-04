import { describe, expect, it } from "vitest";
import { households } from "../db/schema";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import { MealWeekNotFoundError } from "./meal-weeks";

const db = setUpTestDatabase();
// Monday 5 Oct 2026: the current Meal Week is Sat 3 – Fri 9 Oct.
const now = "2026-10-05T12:00:00Z";
const current = "2026-10-03";
const next = "2026-10-10";
const previous = "2026-09-26";

async function setUp() {
  const member = await signedInMember(db);
  return { member, app: testApplication(db, { now }) };
}

describe("get a Meal Week by its start date", () => {
  it("shows a future Meal Week with no Meals as an empty pool", async () => {
    const { member, app } = await setUp();

    expect(await app.getMealWeek({ member, startDate: next })).toEqual({
      startDate: next,
      endDate: "2026-10-16",
      relation: "future",
      mealCount: 14,
      plannedMealCount: 0,
      eatenMealCount: 0,
      meals: [],
    });
  });

  it("tells past, current and future Meal Weeks apart", async () => {
    const { member, app } = await setUp();
    const relation = async (startDate: string) =>
      (await app.getMealWeek({ member, startDate })).relation;

    expect(await relation(previous)).toBe("past");
    expect(await relation(current)).toBe("current");
    expect(await relation(next)).toBe("future");
    expect((await app.getCurrentMealWeek({ member })).relation).toBe("current");
  });

  it("does not create the Meal Week by viewing it", async () => {
    const { member, app } = await setUp();
    await app.getMealWeek({ member, startDate: next });
    // A created Meal Week would keep the Meal Count it was created with.
    await db.update(households).set({ mealCount: 20 });

    expect((await app.getMealWeek({ member, startDate: next })).mealCount).toBe(20);
  });

  it("refuses a date that is not a Meal Week start", async () => {
    const { member, app } = await setUp();
    for (const startDate of ["2026-10-05", "2026-02-30", "next week", ""]) {
      await expect(app.getMealWeek({ member, startDate })).rejects.toBeInstanceOf(
        MealWeekNotFoundError,
      );
    }
  });
});

describe("plan another Meal Week", () => {
  it("creates a future Meal Week when its first Meal is planned", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: next });
    await db.update(households).set({ mealCount: 20 });

    const nextWeek = await app.getMealWeek({ member, startDate: next });
    expect(nextWeek.meals.map((meal) => meal.dish.name)).toEqual(["Pizza"]);
    expect(nextWeek.mealCount).toBe(14);
    expect((await app.getCurrentMealWeek({ member })).meals).toEqual([]);
  });

  it("plans any future Meal Week", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Birthday cake", mealWeekStartDate: "2026-12-19" });

    const week = await app.getMealWeek({ member, startDate: "2026-12-19" });
    expect(week.meals.map((meal) => meal.dish.name)).toEqual(["Birthday cake"]);
  });

  it("plans the current Meal Week when no start date is given", async () => {
    const { member, app } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });

    const week = await app.getMealWeek({ member, startDate: current });
    expect(week.meals.map((meal) => meal.dish.name)).toEqual(["Pizza"]);
  });

  it("refuses to plan into a date that is not a Meal Week start", async () => {
    const { member, app } = await setUp();
    await expect(
      app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: "2026-10-06" }),
    ).rejects.toBeInstanceOf(MealWeekNotFoundError);
  });
});
