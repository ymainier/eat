import { and, asc, count, eq, inArray, ne, sql } from "drizzle-orm";
import type { Database, Executor, Transaction } from "../db/client";
import { dishTags, dishes } from "../db/schema";
import { tagName, tagNames } from "../domain/tag";
import { DishNotFoundError } from "./dishes";
import { isUuid } from "./meals";
import type { Member } from "./members";

export type TagView = { name: string; dishCount: number };

const householdDishes = (db: Executor, householdId: string) =>
  db.select({ id: dishes.id }).from(dishes).where(eq(dishes.householdId, householdId));

const named = (name: string) => sql`lower(${dishTags.name}) = lower(${name})`;

/**
 * Serialises Tag changes within a Household, so concurrent edits can't store
 * one Tag under two spellings.
 */
async function lockHouseholdTags(tx: Transaction, householdId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`tags:${householdId}`}))`);
}

async function lockOwnDish(tx: Transaction, member: Member, dishId: string) {
  if (!isUuid(dishId)) throw new DishNotFoundError(dishId);
  await lockHouseholdTags(tx, member.householdId);
  const [dish] = await tx
    .select({ id: dishes.id })
    .from(dishes)
    .where(and(eq(dishes.id, dishId), eq(dishes.householdId, member.householdId)));
  if (!dish) throw new DishNotFoundError(dishId);
  return dish;
}

/** The spelling the Household already uses for each typed Tag, if any. */
async function existingSpellings(
  tx: Transaction,
  householdId: string,
  dishId: string,
  typed: string[],
) {
  if (typed.length === 0) return new Map<string, string>();
  const existing = await tx
    .selectDistinct({ name: dishTags.name })
    .from(dishTags)
    .where(
      and(
        inArray(dishTags.dishId, householdDishes(tx, householdId)),
        ne(dishTags.dishId, dishId),
        inArray(
          sql`lower(${dishTags.name})`,
          typed.map((name) => name.toLowerCase()),
        ),
      ),
    );
  return new Map(existing.map((t) => [t.name.toLowerCase(), t.name]));
}

/** Tags of each Dish, sorted by name ignoring case. */
export async function tagsOfDishes(
  db: Executor,
  dishIds: string[],
): Promise<Map<string, string[]>> {
  const tags = new Map<string, string[]>(dishIds.map((id) => [id, []]));
  if (dishIds.length === 0) return tags;
  const rows = await db
    .select({ dishId: dishTags.dishId, name: dishTags.name })
    .from(dishTags)
    .where(inArray(dishTags.dishId, dishIds))
    .orderBy(asc(sql`lower(${dishTags.name})`));
  for (const row of rows) tags.get(row.dishId)!.push(row.name);
  return tags;
}

/**
 * Replaces a Dish's Tags. A typed Tag matching one the Household already uses,
 * ignoring case, takes that Tag's spelling.
 */
export async function setDishTags(
  deps: { db: Database },
  input: { member: Member; dishId: string; tags: string[] },
) {
  const typed = tagNames(input.tags);
  await deps.db.transaction(async (tx) => {
    const dish = await lockOwnDish(tx, input.member, input.dishId);
    const spelling = await existingSpellings(tx, input.member.householdId, dish.id, typed);

    await tx.delete(dishTags).where(eq(dishTags.dishId, dish.id));
    if (typed.length) {
      await tx.insert(dishTags).values(
        typed.map((name) => ({
          dishId: dish.id,
          name: spelling.get(name.toLowerCase()) ?? name,
        })),
      );
    }
  });
}

/** Adds one Tag to a Dish, taking the Household's existing spelling if there is one. */
export async function addDishTag(
  deps: { db: Database },
  input: { member: Member; dishId: string; tag: string },
) {
  const typed = tagName(input.tag);
  await deps.db.transaction(async (tx) => {
    const dish = await lockOwnDish(tx, input.member, input.dishId);
    const spelling = await existingSpellings(tx, input.member.householdId, dish.id, [typed]);
    await tx
      .insert(dishTags)
      .values({ dishId: dish.id, name: spelling.get(typed.toLowerCase()) ?? typed })
      .onConflictDoNothing();
  });
}

/** Removes one Tag from a Dish. */
export async function removeDishTag(
  deps: { db: Database },
  input: { member: Member; dishId: string; tag: string },
) {
  await deps.db.transaction(async (tx) => {
    const dish = await lockOwnDish(tx, input.member, input.dishId);
    await tx.delete(dishTags).where(and(eq(dishTags.dishId, dish.id), named(input.tag)));
  });
}

/** Tags carried by at least one of the Household's Dishes, archived ones included. */
export async function listTags(
  deps: { db: Database },
  input: { member: Member },
): Promise<TagView[]> {
  return deps.db
    .select({ name: sql<string>`min(${dishTags.name})`, dishCount: count() })
    .from(dishTags)
    .where(inArray(dishTags.dishId, householdDishes(deps.db, input.member.householdId)))
    .groupBy(sql`lower(${dishTags.name})`)
    .orderBy(asc(sql`lower(${dishTags.name})`));
}

/**
 * Renames a Tag on every Dish carrying it. Renaming onto another existing Tag
 * merges the two.
 */
export async function renameTag(
  deps: { db: Database },
  input: { member: Member; name: string; newName: string },
) {
  const newName = tagName(input.newName);
  await deps.db.transaction(async (tx) => {
    await lockHouseholdTags(tx, input.member.householdId);
    const own = inArray(dishTags.dishId, householdDishes(tx, input.member.householdId));
    // Dishes carrying both Tags keep a single one.
    const carryingNewName = tx
      .select({ dishId: dishTags.dishId })
      .from(dishTags)
      .where(and(own, named(newName)));
    await tx
      .delete(dishTags)
      .where(
        and(
          own,
          named(input.name),
          sql`lower(${input.name}) <> lower(${newName})`,
          inArray(dishTags.dishId, carryingNewName),
        ),
      );
    await tx
      .update(dishTags)
      .set({ name: newName })
      .where(and(own, sql`lower(${dishTags.name}) in (lower(${input.name}), lower(${newName}))`));
  });
}

/** Removes a Tag from every Dish carrying it. */
export async function deleteTag(
  deps: { db: Database },
  input: { member: Member; name: string },
) {
  await deps.db
    .delete(dishTags)
    .where(
      and(
        inArray(dishTags.dishId, householdDishes(deps.db, input.member.householdId)),
        named(input.name),
      ),
    );
}
