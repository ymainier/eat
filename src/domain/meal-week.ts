import type { Weekday } from "./household";

/** A calendar date with no time or timezone, as "YYYY-MM-DD". */
export type CalendarDate = string;

export type MealWeekPeriod = {
  startDate: CalendarDate;
  /** The last day, inclusive. */
  endDate: CalendarDate;
};

/**
 * From `from` on, Meal Weeks start on `startDay`; `from` is such a day. The
 * first change also covers every earlier date.
 */
export type StartDayChange = { from: CalendarDate; startDay: Weekday };

/** A Household's start-day changes, oldest first; never empty. */
export type MealWeekSchedule = readonly StartDayChange[];

/** The schedule of a Household that has always started its Meal Weeks on `startDay`. */
export function initialSchedule(startDay: Weekday): MealWeekSchedule {
  return [{ from: firstOnOrAfter("2000-01-01", startDay), startDay }];
}

/**
 * The Meal Week containing `date`. Meal Weeks are seven days, except the last
 * one before a start-day change, which runs until the change (8 to 13 days).
 */
export function mealWeekOn(date: CalendarDate, schedule: MealWeekSchedule): MealWeekPeriod {
  let index = 0;
  while (index + 1 < schedule.length && schedule[index + 1].from <= date) index++;
  const { from } = schedule[index];
  const next = schedule[index + 1];

  let week = Math.floor(daysBetween(from, date) / 7);
  if (!next) return sevenDaysFrom(addDays(from, week * 7));
  const lastWeek = Math.floor(daysBetween(from, next.from) / 7) - 1;
  if (week < lastWeek) return sevenDaysFrom(addDays(from, week * 7));
  week = lastWeek;
  return { startDate: addDays(from, week * 7), endDate: addDays(next.from, -1) };
}

export function isMealWeekStart(date: CalendarDate, schedule: MealWeekSchedule) {
  return mealWeekOn(date, schedule).startDate === date;
}

/** The start day in force for the Meal Week containing `date`. */
export function startDayOn(date: CalendarDate, schedule: MealWeekSchedule): Weekday {
  return [...schedule].reverse().find((change) => change.from <= date)?.startDay
    ?? schedule[0].startDay;
}

/**
 * Switches Meal Weeks to `startDay` without moving any Meal Week up to and
 * including the one starting on `keep`: the first new Meal Week starts on the
 * first `startDay` after it, and the Meal Week before stretches to meet it.
 * Any change not yet in force after `keep` is replaced.
 */
export function changeStartDay(
  schedule: MealWeekSchedule,
  keep: CalendarDate,
  startDay: Weekday,
): MealWeekSchedule {
  const kept = schedule.filter((change, i) => i === 0 || change.from <= keep);
  if (startDayOn(keep, kept) === startDay) return kept;
  const kept7DaysLater = addDays(mealWeekOn(keep, kept).startDate, 7);
  return [...kept, { from: firstOnOrAfter(kept7DaysLater, startDay), startDay }];
}

function sevenDaysFrom(startDate: CalendarDate): MealWeekPeriod {
  return { startDate, endDate: addDays(startDate, 6) };
}

function firstOnOrAfter(date: CalendarDate, day: Weekday): CalendarDate {
  return addDays(date, (day - weekday(date) + 7) % 7);
}

function daysBetween(from: CalendarDate, to: CalendarDate) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** The calendar date of `instant` in `timezone`. */
export function localDate(instant: Date, timezone: string): CalendarDate {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function weekday(date: CalendarDate): Weekday {
  return new Date(`${date}T00:00:00Z`).getUTCDay() as Weekday;
}

/** Whether the string is a real "YYYY-MM-DD" date. */
export function isCalendarDate(value: string): value is CalendarDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
