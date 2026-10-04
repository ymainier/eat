import { eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { recipes } from "../db/schema";
import { recipe, type Recipe } from "../domain/recipe";
import { findOwnDish, type CatalogueDish } from "./dishes";
import type { Member } from "./members";
import { tagsOfDishes } from "./tags";

export type DishDetail = Omit<CatalogueDish, "hasRecipe" | "lastPlannedIn"> & {
  recipe: Recipe | null;
};

export async function getDish(
  deps: { db: Database },
  input: { member: Member; dishId: string },
): Promise<DishDetail> {
  const dish = await findOwnDish(deps.db, input.member, input.dishId);
  const [[found], tags] = await Promise.all([
    deps.db
      .select({
        ingredients: recipes.ingredients,
        steps: recipes.steps,
        sourceUrl: recipes.sourceUrl,
      })
      .from(recipes)
      .where(eq(recipes.dishId, dish.id)),
    tagsOfDishes(deps.db, [dish.id]),
  ]);
  return {
    id: dish.id,
    name: dish.name,
    archived: dish.archivedAt !== null,
    tags: tags.get(dish.id)!,
    recipe: found ?? null,
  };
}

/** Gives the Dish this Recipe, replacing any it had: a Dish has at most one. */
export async function setRecipe(
  deps: { db: Database },
  input: {
    member: Member;
    dishId: string;
    ingredients: string;
    steps: string;
    sourceUrl?: string | null;
  },
) {
  const value = recipe(input);
  const dish = await findOwnDish(deps.db, input.member, input.dishId);
  await deps.db
    .insert(recipes)
    .values({ dishId: dish.id, ...value })
    .onConflictDoUpdate({
      target: recipes.dishId,
      set: { ...value, updatedAt: new Date() },
    });
}

export async function removeRecipe(
  deps: { db: Database },
  input: { member: Member; dishId: string },
) {
  const dish = await findOwnDish(deps.db, input.member, input.dishId);
  await deps.db.delete(recipes).where(eq(recipes.dishId, dish.id));
}
