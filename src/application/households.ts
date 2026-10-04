import { and, asc, desc, eq, gt } from "drizzle-orm";
import type { Database, Executor, Transaction } from "../db/client";
import { households, mealWeeks, startDayChanges } from "../db/schema";
import { validSettings, type HouseholdSettings, type Weekday } from "../domain/household";
import {
  changeStartDay,
  localDate,
  mealWeekOn,
  type CalendarDate,
  type MealWeekSchedule,
} from "../domain/meal-week";
import type { Clock } from "./clock";
import type { Member } from "./members";

export class HouseholdNotFoundError extends Error {
  constructor(id: string) {
    super(`Household ${id} not found`);
  }
}

export type Household = {
  schedule: MealWeekSchedule;
  mealCount: number;
  timezone: string;
};

export async function loadHousehold(db: Executor, householdId: string): Promise<Household> {
  const [row] = await db.select().from(households).where(eq(households.id, householdId));
  if (!row) throw new HouseholdNotFoundError(householdId);
  const schedule = await db
    .select({ from: startDayChanges.from, startDay: startDayChanges.startDay })
    .from(startDayChanges)
    .where(eq(startDayChanges.householdId, householdId))
    .orderBy(asc(startDayChanges.from));
  return {
    schedule: schedule.map((change) => ({ ...change, startDay: change.startDay as Weekday })),
    mealCount: row.mealCount,
    timezone: row.timezone,
  };
}

/**
 * Keeps the Household's settings from changing until the transaction ends, so
 * a Meal Week created in it follows the schedule it was computed from.
 */
export async function holdHouseholdSettings(tx: Transaction, householdId: string) {
  await tx
    .select({ id: households.id })
    .from(households)
    .where(eq(households.id, householdId))
    .for("share");
}

/** Today's date for the Household. */
export const today = (household: Household, clock: Clock) =>
  localDate(clock.now(), household.timezone);

export type HouseholdSettingsView = HouseholdSettings & {
  /** When the chosen start day is not in force yet: the first Meal Week to use it. */
  startDayFrom: CalendarDate | null;
};

export async function getHouseholdSettings(
  deps: { db: Database; clock: Clock },
  input: { member: Member },
): Promise<HouseholdSettingsView> {
  const household = await loadHousehold(deps.db, input.member.householdId);
  const latest = household.schedule.at(-1)!;
  return {
    startDay: latest.startDay,
    mealCount: household.mealCount,
    timezone: household.timezone,
    startDayFrom: latest.from > today(household, deps.clock) ? latest.from : null,
  };
}

/**
 * Changes the settings for Meal Weeks created from now on. Existing Meal Weeks
 * keep their dates and Meal Count: a new start day takes effect after the
 * latest existing (or current) Meal Week, which stretches to meet it.
 */
export async function updateHouseholdSettings(
  deps: { db: Database; clock: Clock },
  input: { member: Member; settings: HouseholdSettings },
) {
  const settings = validSettings(input.settings);
  const { householdId } = input.member;
  await deps.db.transaction(async (tx) => {
    // Waits for planning in progress (see holdHouseholdSettings), and for
    // other settings changes.
    await tx
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .for("update");
    const household = await loadHousehold(tx, householdId);

    const current = mealWeekOn(today(household, deps.clock), household.schedule);
    const [latest] = await tx
      .select({ startDate: mealWeeks.startDate })
      .from(mealWeeks)
      .where(eq(mealWeeks.householdId, householdId))
      .orderBy(desc(mealWeeks.startDate))
      .limit(1);
    const keep =
      latest && latest.startDate > current.startDate ? latest.startDate : current.startDate;
    const schedule = changeStartDay(household.schedule, keep, settings.startDay);

    await tx
      .delete(startDayChanges)
      .where(and(eq(startDayChanges.householdId, householdId), gt(startDayChanges.from, keep)));
    const added = schedule.filter((change) => change.from > keep);
    if (added.length > 0) {
      await tx
        .insert(startDayChanges)
        .values(added.map((change) => ({ householdId, ...change })));
    }
    await tx
      .update(households)
      .set({ mealCount: settings.mealCount, timezone: settings.timezone })
      .where(eq(households.id, householdId));
  });
}
