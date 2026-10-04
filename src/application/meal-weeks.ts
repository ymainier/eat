import { and, asc, eq } from "drizzle-orm";
import type { Executor } from "../db/client";
import { dishes, mealWeeks, meals } from "../db/schema";
import {
  isCalendarDate,
  mealWeekContaining,
  mealWeekStartingOn,
  weekday,
  type MealWeekPeriod,
} from "../domain/meal-week";
import type { Clock } from "./clock";
import type { DishView } from "./dishes";
import { loadHouseholdSettings } from "./households";
import type { Member } from "./members";

export class MealWeekNotFoundError extends Error {
  constructor(startDate: string) {
    super(`No Meal Week starts on ${startDate}`);
  }
}

export type MealView = { id: string; dish: DishView; eaten: boolean };

export type MealWeekRelation = "past" | "current" | "future";

export type MealWeekView = MealWeekPeriod & {
  relation: MealWeekRelation;
  mealCount: number;
  plannedMealCount: number;
  eatenMealCount: number;
  meals: MealView[];
};

export type MealWeekTarget = {
  period: MealWeekPeriod;
  relation: MealWeekRelation;
  /** The Meal Count the Meal Week gets if it is created now. */
  mealCount: number;
};

/**
 * The Meal Week starting on `startDate`, or the current one. A start date is
 * valid if a Meal Week already starts there or it falls on the Household's
 * start day.
 */
export async function targetMealWeek(
  deps: { db: Executor; clock: Clock },
  member: Member,
  startDate?: string,
): Promise<MealWeekTarget> {
  const settings = await loadHouseholdSettings(deps.db, member.householdId);
  const current = mealWeekContaining(
    deps.clock.now(),
    settings.startDay,
    settings.timezone,
  );
  const target = startDate ?? current.startDate;
  if (!isCalendarDate(target)) throw new MealWeekNotFoundError(target);
  if (
    weekday(target) !== settings.startDay &&
    !(await findMealWeek(deps.db, member.householdId, target))
  ) {
    throw new MealWeekNotFoundError(target);
  }
  return {
    period: mealWeekStartingOn(target),
    relation:
      target < current.startDate ? "past" : target > current.startDate ? "future" : "current",
    mealCount: settings.mealCount,
  };
}

export async function findMealWeek(db: Executor, householdId: string, startDate: string) {
  const [mealWeek] = await db
    .select({
      id: mealWeeks.id,
      mealCount: mealWeeks.mealCount,
      carryOverHandledAt: mealWeeks.carryOverHandledAt,
    })
    .from(mealWeeks)
    .where(and(eq(mealWeeks.householdId, householdId), eq(mealWeeks.startDate, startDate)));
  return mealWeek ?? null;
}

/** Reads a Meal Week without creating it; one with no Meals yet is an empty pool. */
export async function readMealWeek(
  db: Executor,
  householdId: string,
  target: MealWeekTarget,
): Promise<MealWeekView> {
  const mealWeek = await findMealWeek(db, householdId, target.period.startDate);
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
    relation: target.relation,
    mealCount: mealWeek?.mealCount ?? target.mealCount,
    plannedMealCount: pool.length,
    eatenMealCount: pool.filter((meal) => meal.eaten).length,
    meals: pool,
  };
}

/** The Meal Week, created with the target's Meal Count if needed. */
export async function findOrCreateMealWeek(
  db: Executor,
  householdId: string,
  target: MealWeekTarget,
) {
  await db
    .insert(mealWeeks)
    .values({
      householdId,
      startDate: target.period.startDate,
      mealCount: target.mealCount,
    })
    .onConflictDoNothing();
  const mealWeek = await findMealWeek(db, householdId, target.period.startDate);
  return mealWeek!;
}
