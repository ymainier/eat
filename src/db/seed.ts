import { households } from "./schema";
import type { Database } from "./client";
import type { HouseholdSettings } from "../domain/household";

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
  const [created] = await db
    .insert(households)
    .values({ name: "Our household", ...settings })
    .returning({ id: households.id });
  return created.id;
}
