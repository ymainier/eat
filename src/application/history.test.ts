import { describe, expect, it } from "vitest";
import { households } from "../db/schema";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";

const db = setUpTestDatabase();
// Monday 5 Oct 2026: the current Meal Week is Sat 3 – Fri 9 Oct.
const now = "2026-10-05T12:00:00Z";

describe("history of past Meal Weeks", () => {
  it("lists past Meal Weeks, most recent first", async () => {
    const member = await signedInMember(db);
    const app = testApplication(db, { now });
    for (const mealWeekStartDate of [
      "2026-09-12",
      "2026-09-26",
      // Current and future Meal Weeks are not history.
      "2026-10-03",
      "2026-10-10",
    ]) {
      await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate });
    }

    const history = await app.listPastMealWeeks({ member });
    expect(history.map((week) => [week.startDate, week.endDate])).toEqual([
      ["2026-09-26", "2026-10-02"],
      // 19 Sept had no Meals, so it never existed.
      ["2026-09-12", "2026-09-18"],
    ]);
  });

  it("counts planned and eaten Meals against each Meal Week's own Meal Count", async () => {
    const member = await signedInMember(db);
    const app = testApplication(db, { now });
    const plan = async (mealWeekStartDate: string, dishNames: string[]) => {
      for (const dishName of dishNames) {
        await app.planMeal({ member, dishName, mealWeekStartDate });
      }
      return (await app.getMealWeek({ member, startDate: mealWeekStartDate })).meals;
    };
    const [pizza, curry] = await plan("2026-09-26", ["Pizza", "Curry", "Tacos"]);
    await app.markMealEaten({ member, mealId: pizza.id });
    await app.markMealEaten({ member, mealId: curry.id });
    await db.update(households).set({ mealCount: 10 });
    await plan("2026-09-19", ["Chili"]);

    expect(await app.listPastMealWeeks({ member })).toEqual([
      {
        startDate: "2026-09-26",
        endDate: "2026-10-02",
        mealCount: 14,
        plannedMealCount: 3,
        eatenMealCount: 2,
      },
      {
        startDate: "2026-09-19",
        endDate: "2026-09-25",
        mealCount: 10,
        plannedMealCount: 1,
        eatenMealCount: 0,
      },
    ]);
  });

  it("leaves out a past Meal Week whose Meals were all removed or carried over", async () => {
    const member = await signedInMember(db);
    const app = testApplication(db, { now });
    await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: "2026-09-19" });
    const curry = await app.planMeal({
      member,
      dishName: "Curry",
      mealWeekStartDate: "2026-09-26",
    });
    const [onlyMeal] = (await app.getMealWeek({ member, startDate: "2026-09-19" })).meals;
    await app.removeMeal({ member, mealId: onlyMeal.id });
    await app.carryOver({ member, fromStartDate: "2026-09-26", mealIds: [curry.id] });

    expect(await app.listPastMealWeeks({ member })).toEqual([]);
  });

  it("is empty before any Meal Week has passed", async () => {
    const member = await signedInMember(db);
    const app = testApplication(db, { now });
    await app.planMeal({ member, dishName: "Pizza" });

    expect(await app.listPastMealWeeks({ member })).toEqual([]);
  });
});
