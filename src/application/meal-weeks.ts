import { and, asc, eq } from "drizzle-orm";
import type { Executor } from "../db/client";
import { dishes, mealWeeks, meals } from "../db/schema";
import { mealWeekContaining, type MealWeekPeriod } from "../domain/meal-week";
import type { Clock } from "./clock";
import type { DishView } from "./dishes";
import { loadHouseholdSettings } from "./households";
import type { Member } from "./members";

export type MealView = { id: string; dish: DishView; eaten: boolean };

export type MealWeekView = MealWeekPeriod & {
  mealCount: number;
  plannedMealCount: number;
  eatenMealCount: number;
  meals: MealView[];
};

/** The current Meal Week's period, and the Meal Count it would be created with. */
export async function currentMealWeekPeriod(
  deps: { db: Executor; clock: Clock },
  member: Member,
) {
  const settings = await loadHouseholdSettings(deps.db, member.householdId);
  const period = mealWeekContaining(
    deps.clock.now(),
    settings.startDay,
    settings.timezone,
  );
  return { period, mealCount: settings.mealCount };
}

/** Reads a Meal Week without creating it; one with no Meals yet is an empty pool. */
export async function readMealWeek(
  db: Executor,
  householdId: string,
  target: { period: MealWeekPeriod; mealCount: number },
): Promise<MealWeekView> {
  const [mealWeek] = await db
    .select()
    .from(mealWeeks)
    .where(
      and(
        eq(mealWeeks.householdId, householdId),
        eq(mealWeeks.startDate, target.period.startDate),
      ),
    );
  const pool = mealWeek
    ? await db
        .select({
          id: meals.id,
          dish: { id: dishes.id, name: dishes.name },
          eaten: meals.eaten,
        })
        .from(meals)
        .innerJoin(dishes, eq(dishes.id, meals.dishId))
        .where(eq(meals.mealWeekId, mealWeek.id))
        .orderBy(asc(meals.createdAt), asc(meals.id))
    : [];
  return {
    ...target.period,
    mealCount: mealWeek?.mealCount ?? target.mealCount,
    plannedMealCount: pool.length,
    eatenMealCount: pool.filter((meal) => meal.eaten).length,
    meals: pool,
  };
}

/** The Meal Week starting on this date, created with the given Meal Count if needed. */
export async function findOrCreateMealWeek(
  db: Executor,
  householdId: string,
  target: { period: MealWeekPeriod; mealCount: number },
) {
  await db
    .insert(mealWeeks)
    .values({
      householdId,
      startDate: target.period.startDate,
      mealCount: target.mealCount,
    })
    .onConflictDoNothing();
  const [mealWeek] = await db
    .select({ id: mealWeeks.id })
    .from(mealWeeks)
    .where(
      and(
        eq(mealWeeks.householdId, householdId),
        eq(mealWeeks.startDate, target.period.startDate),
      ),
    );
  return mealWeek;
}
