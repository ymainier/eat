import type { Database } from "../db/client";
import { meals } from "../db/schema";
import { dishName } from "../domain/dish";
import type { Clock } from "./clock";
import { findOrCreateDish } from "./dishes";
import { currentMealWeekPeriod, findOrCreateMealWeek } from "./meal-weeks";
import { MealNotFoundError, ownMeal } from "./meals";
import type { Member } from "./members";

export { DishNameRequiredError } from "../domain/dish";
export { MealNotFoundError } from "./meals";

/**
 * Adds a Meal to the current Meal Week's pool. The Dish is the Household's Dish
 * with that name ignoring case, or a new one. The Meal Week is created by its
 * first Meal.
 */
export async function planMeal(
  deps: { db: Database; clock: Clock },
  input: { member: Member; dishName: string },
) {
  const name = dishName(input.dishName);
  const { householdId } = input.member;
  return deps.db.transaction(async (tx) => {
    const target = await currentMealWeekPeriod({ db: tx, clock: deps.clock }, input.member);
    const mealWeek = await findOrCreateMealWeek(tx, householdId, target);
    const dish = await findOrCreateDish(tx, householdId, name);
    const [meal] = await tx
      .insert(meals)
      .values({ mealWeekId: mealWeek.id, dishId: dish.id })
      .returning({ id: meals.id });
    return { id: meal.id, dish };
  });
}

export async function removeMeal(
  deps: { db: Database },
  input: { member: Member; mealId: string },
) {
  const removed = await deps.db
    .delete(meals)
    .where(ownMeal(deps.db, input.member, input.mealId))
    .returning({ id: meals.id });
  if (removed.length === 0) throw new MealNotFoundError(input.mealId);
}
