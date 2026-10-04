"use server";

import { revalidatePath } from "next/cache";
import { TagNameRequiredError } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";

export async function renameTag(formData: FormData) {
  const member = await requireMember();
  try {
    await application().renameTag({
      member,
      name: String(formData.get("name")),
      newName: String(formData.get("newName") ?? ""),
    });
  } catch (error) {
    // The field is required; a blank name just leaves the Tag as it was.
    if (!(error instanceof TagNameRequiredError)) throw error;
  }
  revalidatePath("/", "layout");
}

export async function deleteTag(formData: FormData) {
  const member = await requireMember();
  await application().deleteTag({ member, name: String(formData.get("name")) });
  revalidatePath("/", "layout");
}
