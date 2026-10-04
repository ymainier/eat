"use server";

import { revalidatePath } from "next/cache";
import {
  DishNameTakenError,
  DishNotFoundError,
  TagNameRequiredError,
} from "@/application";
import { DishNameRequiredError } from "@/domain/dish";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import type { Member } from "@/application";

export type DishFormState = {
  error?: string;
  /** What the Member typed, kept when the change is refused. */
  name?: string;
  /** Changes on every submission, to refresh the field. */
  at?: number;
};

function nameError(error: unknown, name: string): string | null {
  if (error instanceof DishNameTakenError) {
    return error.byArchivedDish
      ? `There is already an Archived Dish called "${name.trim()}". Unarchive it from Archived Dishes.`
      : `There is already a Dish called "${name.trim()}".`;
  }
  if (error instanceof DishNameRequiredError) return "Type a Dish name.";
  if (error instanceof DishNotFoundError) return "That Dish no longer exists.";
  return null;
}

export async function createDish(
  _previous: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  const member = await requireMember();
  const name = String(formData.get("name") ?? "");
  try {
    await application().createDish({ member, name });
  } catch (error) {
    const message = nameError(error, name);
    if (message) return { error: message, name, at: Date.now() };
    throw error;
  }
  revalidatePath("/", "layout");
  return { at: Date.now() };
}

export async function renameDish(
  _previous: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  const member = await requireMember();
  const name = String(formData.get("name") ?? "");
  try {
    await application().renameDish({ member, dishId: String(formData.get("dishId")), name });
  } catch (error) {
    const message = nameError(error, name);
    if (message) return { error: message, name, at: Date.now() };
    throw error;
  }
  revalidatePath("/", "layout");
  return { at: Date.now() };
}

export async function setDishArchived(formData: FormData) {
  const member = await requireMember();
  const input = { member, dishId: String(formData.get("dishId")) };
  try {
    if (formData.get("archived") === "true") {
      await application().archiveDish(input);
    } else {
      await application().unarchiveDish(input);
    }
  } catch (error) {
    if (!(error instanceof DishNotFoundError)) throw error;
  }
  revalidatePath("/", "layout");
}

export async function addDishTag(formData: FormData) {
  await changeTag(formData, (input) => application().addDishTag(input));
}

export async function removeDishTag(formData: FormData) {
  await changeTag(formData, (input) => application().removeDishTag(input));
}

async function changeTag(
  formData: FormData,
  change: (input: { member: Member; dishId: string; tag: string }) => Promise<void>,
) {
  const member = await requireMember();
  try {
    await change({
      member,
      dishId: String(formData.get("dishId")),
      tag: String(formData.get("tag") ?? ""),
    });
  } catch (error) {
    if (!(error instanceof DishNotFoundError || error instanceof TagNameRequiredError)) {
      throw error;
    }
  }
  revalidatePath("/", "layout");
}
