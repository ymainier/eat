import type { Weekday } from "./household";

/** A calendar date with no time or timezone, as "YYYY-MM-DD". */
export type CalendarDate = string;

export type MealWeekPeriod = {
  startDate: CalendarDate;
  /** The last of the seven days, inclusive. */
  endDate: CalendarDate;
};

/**
 * The Meal Week containing `instant`: seven days starting at midnight on the
 * Household's start day, in the Household's timezone.
 */
export function mealWeekContaining(
  instant: Date,
  startDay: Weekday,
  timezone: string,
): MealWeekPeriod {
  const today = localDate(instant, timezone);
  const daysSinceStart = (weekday(today) - startDay + 7) % 7;
  const startDate = addDays(today, -daysSinceStart);
  return { startDate, endDate: addDays(startDate, 6) };
}

function localDate(instant: Date, timezone: string): CalendarDate {
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

export function mealWeekStartingOn(startDate: CalendarDate): MealWeekPeriod {
  return { startDate, endDate: addDays(startDate, 6) };
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
