/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HouseholdSettings = {
  startDay: Weekday;
  mealCount: number;
  /** IANA timezone, e.g. "Europe/London". */
  timezone: string;
};

export class InvalidSettingError extends Error {
  constructor(
    readonly setting: keyof HouseholdSettings,
    message: string,
  ) {
    super(message);
  }
}

/** Checks settings as entered by a Member. */
export function validSettings(settings: HouseholdSettings): HouseholdSettings {
  const { startDay, mealCount, timezone } = settings;
  if (!Number.isInteger(startDay) || startDay < 0 || startDay > 6) {
    throw new InvalidSettingError("startDay", "The start day must be a day of the week.");
  }
  if (!Number.isInteger(mealCount) || mealCount < 1 || mealCount > 99) {
    throw new InvalidSettingError("mealCount", "The Meal Count must be a whole number from 1 to 99.");
  }
  if (!timezone) throw new InvalidSettingError("timezone", "Choose a timezone.");
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    throw new InvalidSettingError("timezone", `"${timezone}" is not a known timezone.`);
  }
  return settings;
}
