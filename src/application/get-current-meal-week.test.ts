import { describe, expect, it } from "vitest";
import { createApplication } from ".";
import { fixedClock } from "./clock";
import { seedHousehold } from "../db/seed";
import { setUpTestDatabase } from "../test/database";
import type { HouseholdSettings } from "../domain/household";

const db = setUpTestDatabase();

async function currentMealWeekAt(now: string, settings: HouseholdSettings) {
  const householdId = await seedHousehold(db, settings);
  const app = createApplication({ db, clock: fixedClock(now) });
  return app.getCurrentMealWeek({ householdId });
}

const london: HouseholdSettings = {
  startDay: 6,
  mealCount: 14,
  timezone: "Europe/London",
};

describe("get current Meal Week", () => {
  // Saturday 3 Oct 2026 starts at 00:00 BST = 23:00 UTC on Friday 2 Oct.
  it("is still the previous Meal Week just before midnight starting the start day", async () => {
    const week = await currentMealWeekAt("2026-10-02T22:59:59.999Z", london);
    expect(week).toMatchObject({ startDate: "2026-09-26", endDate: "2026-10-02" });
  });

  it("starts a new Meal Week at midnight on the start day in the Household's timezone", async () => {
    const week = await currentMealWeekAt("2026-10-02T23:00:00.000Z", london);
    expect(week).toMatchObject({ startDate: "2026-10-03", endDate: "2026-10-09" });
  });

  it("stays the same Meal Week until the last day ends", async () => {
    const week = await currentMealWeekAt("2026-10-09T22:59:59.999Z", london);
    expect(week).toMatchObject({ startDate: "2026-10-03", endDate: "2026-10-09" });
  });

  it("uses the Household's timezone rather than UTC", async () => {
    // 11:30 UTC on Friday 2 Oct is 00:30 on Saturday 3 Oct in Auckland.
    const week = await currentMealWeekAt("2026-10-02T11:30:00Z", {
      ...london,
      timezone: "Pacific/Auckland",
    });
    expect(week).toMatchObject({ startDate: "2026-10-03", endDate: "2026-10-09" });
  });

  it("uses the Household's start day", async () => {
    const week = await currentMealWeekAt("2026-10-04T12:00:00Z", {
      ...london,
      startDay: 1, // Monday
    });
    expect(week).toMatchObject({ startDate: "2026-09-28", endDate: "2026-10-04" });
  });

  it("is an empty pool measured against the Household's Meal Count", async () => {
    const week = await currentMealWeekAt("2026-10-04T12:00:00Z", {
      ...london,
      mealCount: 10,
    });
    expect(week).toMatchObject({ plannedMealCount: 0, mealCount: 10 });
  });
});
