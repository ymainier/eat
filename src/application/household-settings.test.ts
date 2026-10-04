import { describe, expect, it } from "vitest";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import { InvalidSettingError, type HouseholdSettings } from "../domain/household";
import type { Member } from "./members";

const db = setUpTestDatabase();
// Monday 5 Oct 2026: the current Meal Week is Sat 3 – Fri 9 Oct.
const now = "2026-10-05T12:00:00Z";
const saturdays: HouseholdSettings = { startDay: 6, mealCount: 14, timezone: "Europe/London" };

async function setUp() {
  const member = await signedInMember(db, saturdays);
  const app = testApplication(db, { now });
  const update = (changes: Partial<HouseholdSettings>, as: Member = member) =>
    app.updateHouseholdSettings({ member: as, settings: { ...saturdays, ...changes } });
  const period = async (startDate: string, at = app) => {
    const week = await at.getMealWeek({ member, startDate });
    return [week.startDate, week.endDate];
  };
  return { member, app, update, period };
}

describe("Household settings", () => {
  it("start as seeded", async () => {
    const { member, app } = await setUp();
    expect(await app.getHouseholdSettings({ member })).toEqual({
      ...saturdays,
      startDayFrom: null,
    });
  });

  it("change the Meal Count only for Meal Weeks created afterwards", async () => {
    const { member, app, update } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });

    await update({ mealCount: 10 });

    expect((await app.getCurrentMealWeek({ member })).mealCount).toBe(14);
    expect((await app.getMealWeek({ member, startDate: "2026-10-10" })).mealCount).toBe(10);
    expect((await app.getHouseholdSettings({ member })).mealCount).toBe(10);
  });

  it("change the timezone without moving Meal Weeks", async () => {
    const { member, app, update } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });

    await update({ timezone: "Pacific/Auckland" });

    const current = await app.getCurrentMealWeek({ member });
    expect([current.startDate, current.endDate]).toEqual(["2026-10-03", "2026-10-09"]);
    expect(current.meals).toHaveLength(1);
    // 23:30 UTC on Fri 9 Oct is already Saturday 10 Oct in Auckland.
    const auckland = testApplication(db, { now: "2026-10-09T23:30:00Z" });
    expect((await auckland.getCurrentMealWeek({ member })).startDate).toBe("2026-10-10");
  });

  it("refuse values that make no sense", async () => {
    const { member, app, update } = await setUp();
    for (const bad of [
      { startDay: 7 },
      { startDay: 1.5 },
      { mealCount: 0 },
      { mealCount: 2.5 },
      { timezone: "Mars/Olympus_Mons" },
      { timezone: "" },
    ] as Partial<HouseholdSettings>[]) {
      await expect(update(bad)).rejects.toBeInstanceOf(InvalidSettingError);
    }
    expect(await app.getHouseholdSettings({ member })).toMatchObject(saturdays);
  });
});

describe("changing the start day", () => {
  it("stretches the current Meal Week to the first new start day after it", async () => {
    const { member, app, update, period } = await setUp();

    await update({ startDay: 1 }); // Monday

    expect(await app.getHouseholdSettings({ member })).toMatchObject({
      startDay: 1,
      startDayFrom: "2026-10-12",
    });
    const current = await app.getCurrentMealWeek({ member });
    expect([current.startDate, current.endDate]).toEqual(["2026-10-03", "2026-10-11"]);
    expect(current.nextStartDate).toBe("2026-10-12");
    expect(await period("2026-10-12")).toEqual(["2026-10-12", "2026-10-18"]);
    expect(await period("2026-10-19")).toEqual(["2026-10-19", "2026-10-25"]);
    // Earlier Meal Weeks don't move.
    expect(await period("2026-09-26")).toEqual(["2026-09-26", "2026-10-02"]);
    // The old start day no longer starts Meal Weeks after the change.
    await expect(app.getMealWeek({ member, startDate: "2026-10-10" })).rejects.toThrow();
  });

  it("never moves Meal Weeks already planned ahead", async () => {
    const { member, app, update, period } = await setUp();
    await app.planMeal({ member, dishName: "Pizza", mealWeekStartDate: "2026-10-10" });

    await update({ startDay: 1 });

    expect(await period("2026-10-03")).toEqual(["2026-10-03", "2026-10-09"]);
    expect(await period("2026-10-10")).toEqual(["2026-10-10", "2026-10-18"]);
    expect(await period("2026-10-19")).toEqual(["2026-10-19", "2026-10-25"]);
    const planned = await app.getMealWeek({ member, startDate: "2026-10-10" });
    expect(planned.meals.map((m) => m.dish.name)).toEqual(["Pizza"]);
  });

  it("can be changed back before it takes effect", async () => {
    const { member, app, update, period } = await setUp();
    await update({ startDay: 1 });

    await update({ startDay: 6 });

    expect(await app.getHouseholdSettings({ member })).toMatchObject({
      startDay: 6,
      startDayFrom: null,
    });
    expect(await period("2026-10-03")).toEqual(["2026-10-03", "2026-10-09"]);
    expect(await period("2026-10-10")).toEqual(["2026-10-10", "2026-10-16"]);
  });

  it("keeps navigation continuous across the change", async () => {
    const { member, app, update } = await setUp();
    await update({ startDay: 3 }); // Wednesday

    const current = await app.getCurrentMealWeek({ member });
    expect([current.startDate, current.endDate]).toEqual(["2026-10-03", "2026-10-13"]);
    const next = await app.getMealWeek({ member, startDate: current.nextStartDate });
    expect([next.startDate, next.previousStartDate]).toEqual(["2026-10-14", "2026-10-03"]);
  });

  it("offers Carry Over from the stretched Meal Week once the new start day arrives", async () => {
    const { member, app, update } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });
    await update({ startDay: 1 });

    const later = testApplication(db, { now: "2026-10-12T12:00:00Z" });
    expect((await later.getCurrentMealWeek({ member })).startDate).toBe("2026-10-12");
    const candidates = await later.getCarryOverCandidates({ member });
    expect(candidates).toMatchObject({ startDate: "2026-10-03", endDate: "2026-10-11" });
    expect(candidates!.meals.map((m) => m.dish.name)).toEqual(["Pizza"]);
  });

  it("shows the stretched Meal Week's dates in history", async () => {
    const { member, app, update } = await setUp();
    await app.planMeal({ member, dishName: "Pizza" });
    await update({ startDay: 1 });

    const later = testApplication(db, { now: "2026-10-12T12:00:00Z" });
    expect(await later.listPastMealWeeks({ member })).toMatchObject([
      { startDate: "2026-10-03", endDate: "2026-10-11" },
    ]);
  });
});
