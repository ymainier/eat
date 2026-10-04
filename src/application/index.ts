import { households } from "../db/schema";
import type { Database } from "../db/client";
import type { Clock } from "./clock";
import { getCurrentMealWeek } from "./get-current-meal-week";

export type { Clock } from "./clock";
export type { MealWeekView } from "./get-current-meal-week";

export type ApplicationDeps = { db: Database; clock: Clock };

export function createApplication(deps: ApplicationDeps) {
  return {
    getCurrentMealWeek: (input: { householdId: string }) =>
      getCurrentMealWeek(deps, input),

    /**
     * v1 runs a single Household. Until sign-in exists, clients act on it
     * directly; afterwards the acting Member's Household is used instead.
     */
    findSoleHouseholdId: async () => {
      const [row] = await deps.db
        .select({ id: households.id })
        .from(households)
        .limit(1);
      return row?.id ?? null;
    },
  };
}

export type Application = ReturnType<typeof createApplication>;
