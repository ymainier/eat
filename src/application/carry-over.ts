import { and, eq, inArray } from "drizzle-orm";
import type { Database, Executor, Transaction } from "../db/client";
import { mealWeeks, meals } from "../db/schema";
import { addDays, type MealWeekPeriod } from "../domain/meal-week";
import type { Clock } from "./clock";
import {
  findMealWeek,
  findOrCreateMealWeek,
  readMealWeek,
  targetMealWeek,
  type MealView,
} from "./meal-weeks";
import { isUuid } from "./meals";
import type { Member } from "./members";

export type CarryOverCandidates = MealWeekPeriod & { meals: MealView[] };

type Deps = { db: Database; clock: Clock };

/** The current Meal Week and the Meal Week immediately before it, if it exists. */
async function currentAndPrevious(deps: { db: Executor; clock: Clock }, member: Member) {
  const current = await targetMealWeek(deps, member);
  const previousStart = addDays(current.period.startDate, -7);
  const previous = await findMealWeek(deps.db, member.householdId, previousStart);
  return { current, previous, previousStart };
}

/**
 * The uneaten Meals a Member may Carry Over: only from the Meal Week immediately
 * before the current one, and only until Carry Over has been handled.
 */
export async function getCarryOverCandidates(
  deps: Deps,
  input: { member: Member },
): Promise<CarryOverCandidates | null> {
  const { current, previous, previousStart } = await currentAndPrevious(deps, input.member);
  if (!previous || previous.carryOverHandledAt) return null;
  const mealWeek = await readMealWeek(deps.db, input.member.householdId, {
    ...current,
    period: { startDate: previousStart, endDate: addDays(previousStart, 6) },
    relation: "past",
  });
  const uneaten = mealWeek.meals.filter((meal) => !meal.eaten);
  if (uneaten.length === 0) return null;
  return { startDate: mealWeek.startDate, endDate: mealWeek.endDate, meals: uneaten };
}

/**
 * The previous Meal Week, locked, if Carry Over from `fromStartDate` can still
 * be handled: it must still be the Meal Week before the current one (the page
 * may predate a new Meal Week starting) and not yet carried or dismissed.
 */
async function pendingCarryOver(
  tx: Transaction,
  clock: Clock,
  member: Member,
  fromStartDate: string,
) {
  const { current, previous, previousStart } = await currentAndPrevious(
    { db: tx, clock },
    member,
  );
  if (!previous || previousStart !== fromStartDate) return null;
  const [locked] = await tx
    .select({ carryOverHandledAt: mealWeeks.carryOverHandledAt })
    .from(mealWeeks)
    .where(eq(mealWeeks.id, previous.id))
    .for("update");
  if (locked.carryOverHandledAt) return null;
  return { current, previous };
}

/**
 * Moves the chosen uneaten Meals of the previous Meal Week (`fromStartDate`)
 * into the current one, and marks Carry Over as handled. Does nothing once Carry
 * Over was handled, e.g. by another Member; chosen Meals no longer in that
 * Meal Week are ignored.
 */
export async function carryOver(
  deps: Deps,
  input: { member: Member; fromStartDate: string; mealIds: string[] },
) {
  const { householdId } = input.member;
  await deps.db.transaction(async (tx) => {
    const pending = await pendingCarryOver(tx, deps.clock, input.member, input.fromStartDate);
    if (!pending) return;
    const { current, previous } = pending;

    const chosen = and(
      inArray(meals.id, input.mealIds.filter(isUuid)),
      eq(meals.mealWeekId, previous.id),
      eq(meals.eaten, false),
    );
    const movable = await tx.select({ id: meals.id }).from(meals).where(chosen);
    if (movable.length > 0) {
      const mealWeek = await findOrCreateMealWeek(tx, householdId, current);
      await tx.update(meals).set({ mealWeekId: mealWeek.id }).where(chosen);
    }
    await markHandled(tx, previous.id, deps.clock);
  });
}

/** Leaves the previous Meal Week's uneaten Meals where they are and stops offering them. */
export async function dismissCarryOver(
  deps: Deps,
  input: { member: Member; fromStartDate: string },
) {
  await deps.db.transaction(async (tx) => {
    const pending = await pendingCarryOver(tx, deps.clock, input.member, input.fromStartDate);
    if (pending) await markHandled(tx, pending.previous.id, deps.clock);
  });
}

async function markHandled(db: Executor, mealWeekId: string, clock: Clock) {
  await db
    .update(mealWeeks)
    .set({ carryOverHandledAt: clock.now() })
    .where(eq(mealWeeks.id, mealWeekId));
}
