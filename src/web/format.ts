import type { CalendarDate } from "../domain/meal-week";

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Sat 3 Oct" */
export function formatDay(date: CalendarDate) {
  return dayFormat.format(new Date(`${date}T00:00:00Z`)).replace(",", "");
}
