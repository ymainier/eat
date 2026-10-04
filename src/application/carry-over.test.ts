import { describe, expect, it } from "vitest";
import { households } from "../db/schema";
import { setUpTestDatabase } from "../test/database";
import { createUser, signedInMember, testApplication } from "../test/application";

const db = setUpTestDatabase();
// Monday 5 Oct 2026: the current Meal Week is Sat 3 – Fri 9 Oct.
const now = "2026-10-05T12:00:00Z";
const previous = "2026-09-26";
const twoWeeksAgo = "2026-09-19";

const names = (meals: { dish: { name: string } }[]) => meals.map((m) => m.dish.name);

async function setUp(plan: { [startDate: string]: string[] } = {}) {
  const member = await signedInMember(db);
  const app = testApplication(db, { now });
  for (const [mealWeekStartDate, dishNames] of Object.entries(plan)) {
    for (const dishName of dishNames) {
      await app.planMeal({ member, dishName, mealWeekStartDate });
    }
  }
  const mealsOf = async (startDate: string) =>
    (await app.getMealWeek({ member, startDate })).meals;
  return { member, app, mealsOf };
}

describe("Carry Over candidates", () => {
  it("are the uneaten Meals of the Meal Week immediately before the current one", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza", "Curry", "Tacos"] });
    const [, curry] = await mealsOf(previous);
    await app.markMealEaten({ member, mealId: curry.id });

    const carryOver = await app.getCarryOverCandidates({ member });
    expect(carryOver).toMatchObject({ startDate: previous, endDate: "2026-10-02" });
    expect(names(carryOver!.meals)).toEqual(["Pizza", "Tacos"]);
  });

  it("are none when every Meal of the previous Meal Week was eaten", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza"] });
    const [pizza] = await mealsOf(previous);
    await app.markMealEaten({ member, mealId: pizza.id });

    expect(await app.getCarryOverCandidates({ member })).toBeNull();
  });

  it("are never offered from an older Meal Week, e.g. after a skipped week", async () => {
    const { member, app } = await setUp({ [twoWeeksAgo]: ["Pizza"] });

    expect(await app.getCarryOverCandidates({ member })).toBeNull();
  });
});

describe("Carry Over", () => {
  it("moves the chosen Meals into the current Meal Week, creating it", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza", "Curry", "Tacos"] });
    const [pizza, , tacos] = await mealsOf(previous);
    await db.update(households).set({ mealCount: 10 });

    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id, tacos.id] });

    const current = await app.getCurrentMealWeek({ member });
    expect(names(current.meals)).toEqual(["Pizza", "Tacos"]);
    expect(current).toMatchObject({ plannedMealCount: 2, eatenMealCount: 0, mealCount: 10 });
    // Moved, not copied: the rest stay behind, not eaten.
    const left = await mealsOf(previous);
    expect(names(left)).toEqual(["Curry"]);
    expect(left[0].eaten).toBe(false);
  });

  it("adds carried Meals to Meals already planned in the current Meal Week", async () => {
    const { member, app, mealsOf } = await setUp({
      [previous]: ["Pizza"],
      "2026-10-03": ["Roast chicken"],
    });
    const [pizza] = await mealsOf(previous);

    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id] });

    expect(names((await app.getCurrentMealWeek({ member })).meals).sort()).toEqual([
      "Pizza",
      "Roast chicken",
    ]);
  });

  it("is not offered again, to any Member, once carried", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza", "Curry"] });
    const [pizza] = await mealsOf(previous);
    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id] });

    const other = await createUser(db, "other@example.com");
    const otherApp = testApplication(db, { now, allowList: ["other@example.com"] });
    const otherMember = await otherApp.joinHousehold({ userId: other.id, email: other.email });

    expect(await app.getCarryOverCandidates({ member })).toBeNull();
    expect(await otherApp.getCarryOverCandidates({ member: otherMember })).toBeNull();
  });

  it("can be dismissed without carrying anything", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza", "Curry"] });

    await app.dismissCarryOver({ member, fromStartDate: previous });

    expect(await app.getCarryOverCandidates({ member })).toBeNull();
    expect(names(await mealsOf(previous))).toEqual(["Pizza", "Curry"]);
    expect((await app.getCurrentMealWeek({ member })).meals).toEqual([]);
  });

  it("does nothing once another Member has carried over, e.g. from a stale page", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza", "Curry"] });
    const [pizza, curry] = await mealsOf(previous);
    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id] });

    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id, curry.id] });

    expect(names((await app.getCurrentMealWeek({ member })).meals)).toEqual(["Pizza"]);
    expect(names(await mealsOf(previous))).toEqual(["Curry"]);
  });

  it("does nothing once another Member has dismissed it", async () => {
    const { member, app, mealsOf } = await setUp({ [previous]: ["Pizza"] });
    const [pizza] = await mealsOf(previous);
    await app.dismissCarryOver({ member, fromStartDate: previous });

    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id] });

    expect((await app.getCurrentMealWeek({ member })).meals).toEqual([]);
    expect(names(await mealsOf(previous))).toEqual(["Pizza"]);
  });

  it("does nothing when a new Meal Week started since the prompt was shown", async () => {
    const { member, mealsOf } = await setUp({
      [previous]: ["Pizza"],
      "2026-10-03": ["Curry"],
    });
    const [pizza] = await mealsOf(previous);
    // Saturday 10 Oct: the prompt for 26 Sept is now stale.
    const later = testApplication(db, { now: "2026-10-10T12:00:00Z" });

    await later.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id] });
    await later.dismissCarryOver({ member, fromStartDate: previous });

    const candidates = await later.getCarryOverCandidates({ member });
    expect(candidates).toMatchObject({ startDate: "2026-10-03" });
    expect(names(candidates!.meals)).toEqual(["Curry"]);
    expect(names(await mealsOf(previous))).toEqual(["Pizza"]);
  });

  it("only moves uneaten Meals of the previous Meal Week", async () => {
    const { member, app, mealsOf } = await setUp({
      [previous]: ["Pizza", "Curry"],
      [twoWeeksAgo]: ["Tacos"],
    });
    const [pizza, curry] = await mealsOf(previous);
    const [tacos] = await mealsOf(twoWeeksAgo);
    await app.markMealEaten({ member, mealId: curry.id });

    await app.carryOver({ member, fromStartDate: previous, mealIds: [pizza.id, curry.id, tacos.id, "not-an-id"] });

    expect(names((await app.getCurrentMealWeek({ member })).meals)).toEqual(["Pizza"]);
    expect(names(await mealsOf(previous))).toEqual(["Curry"]);
    expect(names(await mealsOf(twoWeeksAgo))).toEqual(["Tacos"]);
  });
});
