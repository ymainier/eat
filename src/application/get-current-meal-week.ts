import type { Database } from "../db/client";
import { mealWeekContaining, type MealWeekPeriod } from "../domain/meal-week";
import type { Clock } from "./clock";
import { loadHouseholdSettings } from "./households";
import type { Member } from "./members";

export type MealWeekView = MealWeekPeriod & {
  mealCount: number;
  plannedMealCount: number;
};

/** Reads the current Meal Week without creating it. */
export async function getCurrentMealWeek(
  deps: { db: Database; clock: Clock },
  input: { member: Member },
): Promise<MealWeekView> {
  const settings = await loadHouseholdSettings(
    deps.db,
    input.member.householdId,
  );
  const period = mealWeekContaining(
    deps.clock.now(),
    settings.startDay,
    settings.timezone,
  );
  return { ...period, mealCount: settings.mealCount, plannedMealCount: 0 };
}
