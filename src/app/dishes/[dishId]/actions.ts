"use server";

import { revalidatePath } from "next/cache";
import { DishNotFoundError, EmptyRecipeError, InvalidSourceUrlError } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";

type RecipeValues = { ingredients: string; steps: string; sourceUrl: string };

export type RecipeFormState = {
  error?: string;
  /** What the Member typed, kept when the Recipe is refused. */
  values?: RecipeValues;
  /** Changes on every submission, to refresh the fields. */
  at?: number;
};

export async function saveRecipe(
  _previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const member = await requireMember();
  const values: RecipeValues = {
    ingredients: String(formData.get("ingredients") ?? ""),
    steps: String(formData.get("steps") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
  };
  const refused = (error: string) => ({ error, values, at: Date.now() });
  try {
    await application().setRecipe({
      member,
      dishId: String(formData.get("dishId")),
      ...values,
    });
  } catch (error) {
    if (error instanceof InvalidSourceUrlError) {
      return refused("The source URL must be a web address starting with http:// or https://.");
    }
    if (error instanceof EmptyRecipeError) {
      return refused("Add ingredients, steps or a source URL.");
    }
    if (error instanceof DishNotFoundError) return refused("That Dish no longer exists.");
    throw error;
  }
  revalidatePath("/", "layout");
  return { at: Date.now() };
}

export async function removeRecipe(formData: FormData) {
  const member = await requireMember();
  try {
    await application().removeRecipe({ member, dishId: String(formData.get("dishId")) });
  } catch (error) {
    if (!(error instanceof DishNotFoundError)) throw error;
  }
  revalidatePath("/", "layout");
}
