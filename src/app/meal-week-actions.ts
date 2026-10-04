"use server";

import { revalidatePath } from "next/cache";
import {
  DishNameRequiredError,
  MealNotFoundError,
  MealWeekNotFoundError,
} from "@/application";
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
      mealWeekStartDate: String(formData.get("mealWeekStartDate")),
    });
  } catch (error) {
    if (error instanceof DishNameRequiredError) return { error: "Type a Dish name." };
    if (error instanceof MealWeekNotFoundError) return { error: "That Meal Week doesn't exist." };
    throw error;
  }
  revalidatePath("/", "layout");
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
