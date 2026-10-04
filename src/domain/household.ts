/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HouseholdSettings = {
  startDay: Weekday;
  mealCount: number;
  /** IANA timezone, e.g. "Europe/London". */
  timezone: string;
};
