import { eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { households } from "../db/schema";
import type { HouseholdSettings, Weekday } from "../domain/household";

export class HouseholdNotFoundError extends Error {
  constructor(id: string) {
    super(`Household ${id} not found`);
  }
}

export async function loadHouseholdSettings(
  db: Database,
  householdId: string,
): Promise<HouseholdSettings> {
  const [row] = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId));
  if (!row) throw new HouseholdNotFoundError(householdId);
  return {
    startDay: row.startDay as Weekday,
    mealCount: row.mealCount,
    timezone: row.timezone,
  };
}
