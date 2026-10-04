import type { Database } from "../db/client";
import type { Clock } from "./clock";
import { currentMealWeekPeriod, readMealWeek, type MealWeekView } from "./meal-weeks";
import type { Member } from "./members";

/** Reads the current Meal Week without creating it. */
export async function getCurrentMealWeek(
  deps: { db: Database; clock: Clock },
  input: { member: Member },
): Promise<MealWeekView> {
  const target = await currentMealWeekPeriod(deps, input.member);
  return readMealWeek(deps.db, input.member.householdId, target);
}
