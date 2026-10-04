import { and, asc, eq, exists, ilike, isNotNull, isNull, max, sql } from "drizzle-orm";
import type { Database, Executor } from "../db/client";
import { dishTags, dishes, mealWeeks, meals } from "../db/schema";
import { dishName } from "../domain/dish";
import type { CalendarDate } from "../domain/meal-week";
import { isUuid } from "./meals";
import type { Member } from "./members";
import { tagsOfDishes } from "./tags";

export class DishNameTakenError extends Error {
  constructor(
    name: string,
    /** Whether the Dish holding the name is archived (so not in the active catalogue). */
    readonly byArchivedDish: boolean,
  ) {
    super(`A${byArchivedDish ? "n archived" : ""} Dish named "${name}" already exists`);
  }
}

export class DishNotFoundError extends Error {
  constructor(id: string) {
    super(`Dish ${id} not found`);
  }
}

export type DishView = { id: string; name: string };

export type CatalogueDish = DishView & {
  tags: string[];
  archived: boolean;
  /** Start date of the latest Meal Week the Dish was planned in. */
  lastPlannedIn: CalendarDate | null;
};

const sameName = (householdId: string, name: string) =>
  and(eq(dishes.householdId, householdId), sql`lower(${dishes.name}) = lower(${name})`);

/**
 * The Household's Dish with this name ignoring case, created if there is none.
 * Planning an Archived Dish by name brings it back into the catalogue.
 */
export async function findOrCreateDish(
  db: Executor,
  householdId: string,
  name: string,
): Promise<DishView> {
  await db.insert(dishes).values({ householdId, name }).onConflictDoNothing();
  const [dish] = await db
    .update(dishes)
    .set({ archivedAt: null })
    .where(sameName(householdId, name))
    .returning({ id: dishes.id, name: dishes.name });
  return dish;
}

/**
 * Active Dishes by name, or Archived Dishes with `archived: true`; optionally
 * only those whose name contains `search` or that carry `tag` (ignoring case).
 */
export async function listDishes(
  db: Executor,
  input: { member: Member; search?: string; archived?: boolean; tag?: string },
): Promise<CatalogueDish[]> {
  const search = input.search?.trim();
  const rows = await db
    .select({
      id: dishes.id,
      name: dishes.name,
      archivedAt: dishes.archivedAt,
      lastPlannedIn: max(mealWeeks.startDate),
    })
    .from(dishes)
    .leftJoin(meals, eq(meals.dishId, dishes.id))
    .leftJoin(mealWeeks, eq(mealWeeks.id, meals.mealWeekId))
    .where(
      and(
        eq(dishes.householdId, input.member.householdId),
        input.archived ? isNotNull(dishes.archivedAt) : isNull(dishes.archivedAt),
        search ? ilike(dishes.name, `%${escapeLike(search)}%`) : undefined,
        input.tag
          ? exists(
              db
                .select({ id: dishTags.id })
                .from(dishTags)
                .where(
                  and(
                    eq(dishTags.dishId, dishes.id),
                    sql`lower(${dishTags.name}) = lower(${input.tag})`,
                  ),
                ),
            )
          : undefined,
      ),
    )
    .groupBy(dishes.id)
    .orderBy(asc(sql`lower(${dishes.name})`));
  const tags = await tagsOfDishes(db, rows.map((row) => row.id));
  return rows.map(({ archivedAt, ...dish }) => ({
    ...dish,
    tags: tags.get(dish.id)!,
    archived: archivedAt !== null,
  }));
}

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function createDish(
  deps: { db: Database },
  input: { member: Member; name: string },
): Promise<DishView> {
  const name = dishName(input.name);
  const [dish] = await deps.db
    .insert(dishes)
    .values({ householdId: input.member.householdId, name })
    .onConflictDoNothing()
    .returning({ id: dishes.id, name: dishes.name });
  if (!dish) throw await nameTaken(deps.db, input.member.householdId, name);
  return dish;
}

export async function renameDish(
  deps: { db: Database },
  input: { member: Member; dishId: string; name: string },
) {
  const name = dishName(input.name);
  try {
    await updateOwnDish(deps.db, input, { name });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw await nameTaken(deps.db, input.member.householdId, name);
    }
    throw error;
  }
}

export const archiveDish = (deps: { db: Database }, input: { member: Member; dishId: string }) =>
  updateOwnDish(deps.db, input, { archivedAt: new Date() });

export const unarchiveDish = (deps: { db: Database }, input: { member: Member; dishId: string }) =>
  updateOwnDish(deps.db, input, { archivedAt: null });

async function updateOwnDish(
  db: Database,
  input: { member: Member; dishId: string },
  changes: Partial<typeof dishes.$inferInsert>,
) {
  if (!isUuid(input.dishId)) throw new DishNotFoundError(input.dishId);
  const updated = await db
    .update(dishes)
    .set(changes)
    .where(and(eq(dishes.id, input.dishId), eq(dishes.householdId, input.member.householdId)))
    .returning({ id: dishes.id });
  if (updated.length === 0) throw new DishNotFoundError(input.dishId);
}

async function nameTaken(db: Database, householdId: string, name: string) {
  const [holder] = await db
    .select({ archivedAt: dishes.archivedAt })
    .from(dishes)
    .where(sameName(householdId, name));
  return new DishNameTakenError(name, holder?.archivedAt != null);
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
}
