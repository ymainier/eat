import type { Database } from "../db/client";
import type { Clock } from "./clock";
import { readMealWeek, targetMealWeek, type MealWeekView } from "./meal-weeks";
import type { Member } from "./members";

/** Reads the current Meal Week without creating it. */
export async function getCurrentMealWeek(
  deps: { db: Database; clock: Clock },
  input: { member: Member },
): Promise<MealWeekView> {
  const target = await targetMealWeek(deps, input.member);
  return readMealWeek(deps.db, input.member.householdId, target);
}

/** Reads the Meal Week starting on `startDate` without creating it. */
export async function getMealWeek(
  deps: { db: Database; clock: Clock },
  input: { member: Member; startDate: string },
): Promise<MealWeekView> {
  const target = await targetMealWeek(deps, input.member, input.startDate);
  return readMealWeek(deps.db, input.member.householdId, target);
}
