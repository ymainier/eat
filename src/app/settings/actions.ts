"use server";

import { revalidatePath } from "next/cache";
import { InvalidSettingError, type Weekday } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";

export type SettingsFormState = { error?: string; saved?: number };

export async function saveSettings(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const member = await requireMember();
  try {
    await application().updateHouseholdSettings({
      member,
      settings: {
        startDay: Number(formData.get("startDay")) as Weekday,
        mealCount: Number(formData.get("mealCount")),
        timezone: String(formData.get("timezone") ?? ""),
      },
    });
  } catch (error) {
    if (error instanceof InvalidSettingError) return { error: error.message };
    throw error;
  }
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}
