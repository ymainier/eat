import { and, asc, eq } from "drizzle-orm";
import type { Executor } from "../db/client";
import { dishes, mealWeeks, meals } from "../db/schema";
import {
  addDays,
  isCalendarDate,
  isMealWeekStart,
  mealWeekOn,
  type CalendarDate,
  type MealWeekPeriod,
} from "../domain/meal-week";
import type { Clock } from "./clock";
import { hasRecipe, type DishView } from "./dishes";
import { loadHousehold, today } from "./households";
import type { Member } from "./members";
import { tagsOfDishes } from "./tags";

export class MealWeekNotFoundError extends Error {
  constructor(startDate: string) {
    super(`No Meal Week starts on ${startDate}`);
  }
}

export type MealView = {
  id: string;
  dish: DishView & { tags: string[]; hasRecipe: boolean };
  eaten: boolean;
};

export type MealWeekRelation = "past" | "current" | "future";

/** Where to go from a Meal Week: the Meal Weeks just before and after it. */
type Neighbours = { previousStartDate: CalendarDate; nextStartDate: CalendarDate };

export type MealWeekView = MealWeekPeriod &
  Neighbours & {
  relation: MealWeekRelation;
  mealCount: number;
  plannedMealCount: number;
  eatenMealCount: number;
  meals: MealView[];
};

export type MealWeekTarget = Neighbours & {
  period: MealWeekPeriod;
  relation: MealWeekRelation;
  /** The Meal Count the Meal Week gets if it is created now. */
  mealCount: number;
};

/**
 * The Meal Week starting on `startDate`, or the current one, following the
 * Household's start-day schedule.
 */
export async function targetMealWeek(
  deps: { db: Executor; clock: Clock },
  member: Member,
  startDate?: string,
): Promise<MealWeekTarget> {
  const household = await loadHousehold(deps.db, member.householdId);
  const { schedule } = household;
  const current = mealWeekOn(today(household, deps.clock), schedule);
  const target = startDate ?? current.startDate;
  if (!isCalendarDate(target) || !isMealWeekStart(target, schedule)) {
    throw new MealWeekNotFoundError(target);
  }
  const period = mealWeekOn(target, schedule);
  return {
    period,
    previousStartDate: mealWeekOn(addDays(target, -1), schedule).startDate,
    nextStartDate: addDays(period.endDate, 1),
    relation:
      target < current.startDate ? "past" : target > current.startDate ? "future" : "current",
    mealCount: household.mealCount,
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
          dish: { id: dishes.id, name: dishes.name, hasRecipe: hasRecipe() },
          eaten: meals.eaten,
        })
        .from(meals)
        .innerJoin(dishes, eq(dishes.id, meals.dishId))
        .where(eq(meals.mealWeekId, mealWeek.id))
        .orderBy(asc(meals.createdAt), asc(meals.id))
    : [];
  const tags = await tagsOfDishes(db, [...new Set(pool.map((meal) => meal.dish.id))]);
  const mealsWithTags = pool.map((meal) => ({
    ...meal,
    dish: { ...meal.dish, tags: tags.get(meal.dish.id)! },
  }));
  return {
    ...target.period,
    previousStartDate: target.previousStartDate,
    nextStartDate: target.nextStartDate,
    relation: target.relation,
    mealCount: mealWeek?.mealCount ?? target.mealCount,
    plannedMealCount: pool.length,
    eatenMealCount: pool.filter((meal) => meal.eaten).length,
    meals: mealsWithTags,
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
