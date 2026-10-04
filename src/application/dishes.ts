import { and, asc, eq, sql } from "drizzle-orm";
import type { Executor } from "../db/client";
import { dishes } from "../db/schema";
import type { Member } from "./members";

export type DishView = { id: string; name: string };

/** The Household's Dish with this name ignoring case, created if there is none. */
export async function findOrCreateDish(
  db: Executor,
  householdId: string,
  name: string,
): Promise<DishView> {
  await db.insert(dishes).values({ householdId, name }).onConflictDoNothing();
  const [dish] = await db
    .select({ id: dishes.id, name: dishes.name })
    .from(dishes)
    .where(
      and(
        eq(dishes.householdId, householdId),
        sql`lower(${dishes.name}) = lower(${name})`,
      ),
    );
  return dish;
}

export async function listDishes(
  db: Executor,
  input: { member: Member },
): Promise<DishView[]> {
  return db
    .select({ id: dishes.id, name: dishes.name })
    .from(dishes)
    .where(eq(dishes.householdId, input.member.householdId))
    .orderBy(asc(sql`lower(${dishes.name})`));
}
