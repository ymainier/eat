import { describe, expect, it } from "vitest";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import { MealNotFoundError } from "./plan-meals";

const db = setUpTestDatabase();

async function weekWithMeals(...dishNames: string[]) {
  const member = await signedInMember(db);
  const app = testApplication(db);
  for (const dishName of dishNames) await app.planMeal({ member, dishName });
  const { meals } = await app.getCurrentMealWeek({ member });
  return { member, app, meals };
}

describe("mark Meals eaten", () => {
  it("starts every planned Meal as not yet eaten", async () => {
    const { member, app } = await weekWithMeals("Pizza", "Curry");

    const week = await app.getCurrentMealWeek({ member });
    expect(week.meals.map((meal) => meal.eaten)).toEqual([false, false]);
    expect(week).toMatchObject({ eatenMealCount: 0, plannedMealCount: 2 });
  });

  it("marks a Meal eaten", async () => {
    const { member, app, meals } = await weekWithMeals("Pizza", "Curry", "Tacos");
    await app.markMealEaten({ member, mealId: meals[1].id });

    const week = await app.getCurrentMealWeek({ member });
    expect(week.meals.map((meal) => meal.eaten)).toEqual([false, true, false]);
    expect(week).toMatchObject({ eatenMealCount: 1, plannedMealCount: 3 });
  });

  it("undoes marking a Meal eaten", async () => {
    const { member, app, meals } = await weekWithMeals("Pizza");
    await app.markMealEaten({ member, mealId: meals[0].id });
    await app.markMealNotEaten({ member, mealId: meals[0].id });

    const week = await app.getCurrentMealWeek({ member });
    expect(week.meals[0].eaten).toBe(false);
    expect(week.eatenMealCount).toBe(0);
  });

  it("is unchanged when marking a Meal eaten twice", async () => {
    const { member, app, meals } = await weekWithMeals("Pizza");
    await app.markMealEaten({ member, mealId: meals[0].id });
    await app.markMealEaten({ member, mealId: meals[0].id });

    expect((await app.getCurrentMealWeek({ member })).eatenMealCount).toBe(1);
  });

  it("only marks the chosen Meal when a Dish is planned several times", async () => {
    const { member, app, meals } = await weekWithMeals("Chili", "Chili");
    await app.markMealEaten({ member, mealId: meals[0].id });

    const week = await app.getCurrentMealWeek({ member });
    expect(week.meals.map((meal) => meal.eaten)).toEqual([true, false]);
  });

  it("does not mark a Meal of another Household, or one that doesn't exist", async () => {
    const { member, app, meals } = await weekWithMeals("Pizza");
    const stranger = { id: crypto.randomUUID(), householdId: crypto.randomUUID() };

    await expect(
      app.markMealEaten({ member: stranger, mealId: meals[0].id }),
    ).rejects.toBeInstanceOf(MealNotFoundError);
    await expect(
      app.markMealEaten({ member, mealId: crypto.randomUUID() }),
    ).rejects.toBeInstanceOf(MealNotFoundError);
    await expect(
      app.markMealNotEaten({ member, mealId: "not-an-id" }),
    ).rejects.toBeInstanceOf(MealNotFoundError);
    expect((await app.getCurrentMealWeek({ member })).meals[0].eaten).toBe(false);
  });
});
