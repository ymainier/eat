import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "../db/client";
import { mealWeeks, meals } from "../db/schema";
import { dishName } from "../domain/dish";
import type { Clock } from "./clock";
import { findOrCreateDish } from "./dishes";
import { currentMealWeekPeriod, findOrCreateMealWeek } from "./meal-weeks";
import type { Member } from "./members";

export { DishNameRequiredError } from "../domain/dish";

export class MealNotFoundError extends Error {
  constructor(id: string) {
    super(`Meal ${id} not found`);
  }
}

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

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function removeMeal(
  deps: { db: Database },
  input: { member: Member; mealId: string },
) {
  if (!uuid.test(input.mealId)) throw new MealNotFoundError(input.mealId);
  const ownMealWeeks = deps.db
    .select({ id: mealWeeks.id })
    .from(mealWeeks)
    .where(eq(mealWeeks.householdId, input.member.householdId));
  const removed = await deps.db
    .delete(meals)
    .where(and(eq(meals.id, input.mealId), inArray(meals.mealWeekId, ownMealWeeks)))
    .returning({ id: meals.id });
  if (removed.length === 0) throw new MealNotFoundError(input.mealId);
}
