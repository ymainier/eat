"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DishNameRequiredError,
  MealNotFoundError,
  MealWeekNotFoundError,
} from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";

export type PlanMealState = {
  error?: string;
  /** What the Member typed, kept when the Meal is refused. */
  dishName?: string;
  /** Changes on every submission, to refresh the field. */
  at?: number;
};

export async function planMeal(
  _previous: PlanMealState,
  formData: FormData,
): Promise<PlanMealState> {
  const member = await requireMember();
  const dishName = String(formData.get("dishName") ?? "");
  try {
    await application().planMeal({
      member,
      dishName,
      mealWeekStartDate: String(formData.get("mealWeekStartDate")),
    });
  } catch (error) {
    const refused = (message: string) => ({ error: message, dishName, at: Date.now() });
    if (error instanceof DishNameRequiredError) return refused("Type a Dish name.");
    if (error instanceof MealWeekNotFoundError) return refused("That Meal Week doesn't exist.");
    throw error;
  }
  revalidatePath("/", "layout");
  return { at: Date.now() };
}

/** Plans a Meal of a Dish from its page, then shows the Meal Week it went to. */
export async function planDish(formData: FormData) {
  const member = await requireMember();
  const mealWeekStartDate = String(formData.get("mealWeekStartDate"));
  await application().planMeal({
    member,
    dishName: String(formData.get("dishName")),
    mealWeekStartDate,
  });
  revalidatePath("/", "layout");
  const current = await application().getCurrentMealWeek({ member });
  redirect(current.startDate === mealWeekStartDate ? "/" : `/meal-weeks/${mealWeekStartDate}`);
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
  revalidatePath("/", "layout");
}

export async function setMealEaten(formData: FormData) {
  const member = await requireMember();
  const input = { member, mealId: String(formData.get("mealId")) };
  try {
    if (formData.get("eaten") === "true") {
      await application().markMealEaten(input);
    } else {
      await application().markMealNotEaten(input);
    }
  } catch (error) {
    // Removed meanwhile, e.g. by another Member: just show the current pool.
    if (!(error instanceof MealNotFoundError)) throw error;
  }
  revalidatePath("/", "layout");
}

export async function carryOver(formData: FormData) {
  const member = await requireMember();
  await application().carryOver({
    member,
    fromStartDate: String(formData.get("fromStartDate")),
    mealIds: formData.getAll("mealId").map(String),
  });
  revalidatePath("/", "layout");
}

export async function dismissCarryOver(formData: FormData) {
  const member = await requireMember();
  await application().dismissCarryOver({
    member,
    fromStartDate: String(formData.get("fromStartDate")),
  });
  revalidatePath("/", "layout");
}
