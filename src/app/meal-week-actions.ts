"use server";

import { revalidatePath } from "next/cache";
import { DishNameRequiredError, MealNotFoundError } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";

export type PlanMealState = { error?: string };

export async function planMeal(
  _previous: PlanMealState,
  formData: FormData,
): Promise<PlanMealState> {
  const member = await requireMember();
  try {
    await application().planMeal({
      member,
      dishName: String(formData.get("dishName") ?? ""),
    });
  } catch (error) {
    if (error instanceof DishNameRequiredError) return { error: "Type a Dish name." };
    throw error;
  }
  revalidatePath("/");
  return {};
}

export async function removeMeal(formData: FormData) {
  const member = await requireMember();
  try {
    await application().removeMeal({
      member,
      mealId: String(formData.get("mealId")),
    });
  } catch (error) {
    // Already removed, e.g. by another Member: just show the current pool.
    if (!(error instanceof MealNotFoundError)) throw error;
  }
  revalidatePath("/");
}
