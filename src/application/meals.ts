import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "../db/client";
import { mealWeeks, meals } from "../db/schema";
import type { Member } from "./members";

export class MealNotFoundError extends Error {
  constructor(id: string) {
    super(`Meal ${id} not found`);
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => uuid.test(value);

/** Matches the Meal only if it belongs to the Member's Household. */
export function ownMeal(db: Database, member: Member, mealId: string) {
  if (!isUuid(mealId)) throw new MealNotFoundError(mealId);
  const householdMealWeeks = db
    .select({ id: mealWeeks.id })
    .from(mealWeeks)
    .where(eq(mealWeeks.householdId, member.householdId));
  return and(eq(meals.id, mealId), inArray(meals.mealWeekId, householdMealWeeks));
}

async function setEaten(
  deps: { db: Database },
  input: { member: Member; mealId: string },
  eaten: boolean,
) {
  const updated = await deps.db
    .update(meals)
    .set({ eaten })
    .where(ownMeal(deps.db, input.member, input.mealId))
    .returning({ id: meals.id });
  if (updated.length === 0) throw new MealNotFoundError(input.mealId);
}

export const markMealEaten = (
  deps: { db: Database },
  input: { member: Member; mealId: string },
) => setEaten(deps, input, true);

export const markMealNotEaten = (
  deps: { db: Database },
  input: { member: Member; mealId: string },
) => setEaten(deps, input, false);
