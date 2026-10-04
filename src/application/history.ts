import { and, count, desc, eq, gt, lt, sql } from "drizzle-orm";
import type { Database } from "../db/client";
import { mealWeeks, meals } from "../db/schema";
import { mealWeekStartingOn, type MealWeekPeriod } from "../domain/meal-week";
import type { Clock } from "./clock";
import { targetMealWeek } from "./meal-weeks";
import type { Member } from "./members";

export type MealWeekSummary = MealWeekPeriod & {
  mealCount: number;
  plannedMealCount: number;
  eatenMealCount: number;
};

/**
 * Meal Weeks that started before the current one, most recent first. A Meal
 * Week left without Meals (all removed or carried over) is not history.
 */
export async function listPastMealWeeks(
  deps: { db: Database; clock: Clock },
  input: { member: Member },
): Promise<MealWeekSummary[]> {
  const current = await targetMealWeek(deps, input.member);
  const rows = await deps.db
    .select({
      startDate: mealWeeks.startDate,
      mealCount: mealWeeks.mealCount,
      plannedMealCount: count(meals.id),
      eatenMealCount: sql<number>`count(*) filter (where ${meals.eaten})`.mapWith(Number),
    })
    .from(mealWeeks)
    .leftJoin(meals, eq(meals.mealWeekId, mealWeeks.id))
    .where(
      and(
        eq(mealWeeks.householdId, input.member.householdId),
        lt(mealWeeks.startDate, current.period.startDate),
      ),
    )
    .groupBy(mealWeeks.id)
    .having(gt(count(meals.id), 0))
    .orderBy(desc(mealWeeks.startDate));
  return rows.map(({ startDate, ...counts }) => ({
    ...mealWeekStartingOn(startDate),
    ...counts,
  }));
}
