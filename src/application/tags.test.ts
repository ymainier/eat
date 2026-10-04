import { describe, expect, it } from "vitest";
import { setUpTestDatabase } from "../test/database";
import { signedInMember, testApplication } from "../test/application";
import type { Member } from "./members";

const db = setUpTestDatabase();

async function setUp() {
  const member = await signedInMember(db);
  const app = testApplication(db);
  const dish = async (name: string, tags: string[] = []) => {
    const created = await app.createDish({ member, name });
    await app.setDishTags({ member, dishId: created.id, tags });
    return created;
  };
  return { member, app, dish };
}

async function tagsByDish(app: ReturnType<typeof testApplication>, member: Member) {
  const all = [
    ...(await app.listDishes({ member })),
    ...(await app.listDishes({ member, archived: true })),
  ];
  return Object.fromEntries(all.map((d) => [d.name, d.tags]));
}

describe("Tags", () => {
  it("are attached to Dishes by typing them, several per Dish", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", [" pasta ", "Pork", "pasta", ""]);

    expect(await tagsByDish(app, member)).toEqual({ Carbonara: ["pasta", "Pork"] });
  });

  it("reuse an existing Tag's spelling, ignoring case", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", ["Pasta"]);
    await dish("Lasagne", ["PASTA", "beef"]);

    expect(await tagsByDish(app, member)).toEqual({
      Carbonara: ["Pasta"],
      Lasagne: ["beef", "Pasta"],
    });
    expect(await app.listTags({ member })).toEqual([
      { name: "beef", dishCount: 1 },
      { name: "Pasta", dishCount: 2 },
    ]);
  });

  it("can be added to and removed from a Dish one at a time", async () => {
    const { member, app, dish } = await setUp();
    await dish("Lasagne", ["Pasta"]);
    const carbonara = await dish("Carbonara", ["pork"]);

    await app.addDishTag({ member, dishId: carbonara.id, tag: " pasta " });
    await app.addDishTag({ member, dishId: carbonara.id, tag: "PORK" });
    await app.removeDishTag({ member, dishId: carbonara.id, tag: "Pork" });

    expect(await tagsByDish(app, member)).toEqual({ Carbonara: ["Pasta"], Lasagne: ["Pasta"] });
  });

  it("can be replaced on a Dish", async () => {
    const { member, app, dish } = await setUp();
    const carbonara = await dish("Carbonara", ["pasta", "pork"]);

    await app.setDishTags({ member, dishId: carbonara.id, tags: ["pasta", "egg"] });

    expect(await tagsByDish(app, member)).toEqual({ Carbonara: ["egg", "pasta"] });
  });

  it("show on Meals in the Meal Week pool", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", ["pasta", "pork"]);
    await app.planMeal({ member, dishName: "carbonara" });

    const [meal] = (await app.getCurrentMealWeek({ member })).meals;
    expect(meal.dish.tags).toEqual(["pasta", "pork"]);
  });

  it("filter the catalogue, ignoring case", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", ["pasta"]);
    await dish("Chicken curry", ["chicken", "rice"]);
    await dish("Lasagne", ["Pasta", "beef"]);

    const filtered = await app.listDishes({ member, tag: "PASTA" });
    expect(filtered.map((d) => [d.name, d.tags])).toEqual([
      ["Carbonara", ["pasta"]],
      ["Lasagne", ["beef", "pasta"]],
    ]);
  });

  it("are renamed on every Dish carrying them, archived ones included", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", ["pasta"]);
    const lasagne = await dish("Lasagne", ["pasta", "beef"]);
    await app.archiveDish({ member, dishId: lasagne.id });

    await app.renameTag({ member, name: "PASTA", newName: "Noodles" });

    expect(await tagsByDish(app, member)).toEqual({
      Carbonara: ["Noodles"],
      Lasagne: ["beef", "Noodles"],
    });
  });

  it("merge when renamed onto an existing Tag", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", ["spaghetti"]);
    await dish("Lasagne", ["pasta"]);
    await dish("Spaghetti bolognese", ["spaghetti", "Pasta", "beef"]);

    await app.renameTag({ member, name: "spaghetti", newName: "pasta" });

    expect(await tagsByDish(app, member)).toEqual({
      Carbonara: ["pasta"],
      Lasagne: ["pasta"],
      "Spaghetti bolognese": ["beef", "pasta"],
    });
    expect(await app.listTags({ member })).toEqual([
      { name: "beef", dishCount: 1 },
      { name: "pasta", dishCount: 3 },
    ]);
  });

  it("are deleted from every Dish at once", async () => {
    const { member, app, dish } = await setUp();
    await dish("Carbonara", ["pasta", "pork"]);
    await dish("Lasagne", ["Pasta"]);

    await app.deleteTag({ member, name: "pasta" });

    expect(await tagsByDish(app, member)).toEqual({ Carbonara: ["pork"], Lasagne: [] });
    expect(await app.listTags({ member })).toEqual([{ name: "pork", dishCount: 1 }]);
  });

  it("disappear when no Dish carries them any more", async () => {
    const { member, app, dish } = await setUp();
    const carbonara = await dish("Carbonara", ["pasta", "pork"]);

    await app.setDishTags({ member, dishId: carbonara.id, tags: ["pasta"] });

    expect((await app.listTags({ member })).map((t) => t.name)).toEqual(["pasta"]);
    expect(await app.listDishes({ member, tag: "pork" })).toEqual([]);
  });

  it("stay within the Household", async () => {
    const { member, app, dish } = await setUp();
    const carbonara = await dish("Carbonara", ["pasta"]);
    const stranger = { id: crypto.randomUUID(), householdId: crypto.randomUUID() };

    await app.renameTag({ member: stranger, name: "pasta", newName: "x" });
    await app.deleteTag({ member: stranger, name: "pasta" });
    await expect(
      app.setDishTags({ member: stranger, dishId: carbonara.id, tags: ["x"] }),
    ).rejects.toThrow();

    expect(await tagsByDish(app, member)).toEqual({ Carbonara: ["pasta"] });
    expect(await app.listTags({ member: stranger })).toEqual([]);
  });
});
