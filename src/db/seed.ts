import { households, startDayChanges } from "./schema";
import type { Database } from "./client";
import type { HouseholdSettings } from "../domain/household";
import { initialSchedule } from "../domain/meal-week";

export const defaultHouseholdSettings: HouseholdSettings = {
  startDay: 6, // Saturday, the grocery delivery day
  mealCount: 14,
  timezone: "Europe/London",
};

// v1 runs a single Household; seeding is a no-op once it exists.
export async function seedHousehold(
  db: Database,
  settings: HouseholdSettings = defaultHouseholdSettings,
) {
  const existing = await db.select({ id: households.id }).from(households).limit(1);
  if (existing[0]) return existing[0].id;
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(households)
      .values({ name: "Our household", mealCount: settings.mealCount, timezone: settings.timezone })
      .returning({ id: households.id });
    await tx
      .insert(startDayChanges)
      .values(initialSchedule(settings.startDay).map((c) => ({ householdId: created.id, ...c })));
    return created.id;
  });
}
