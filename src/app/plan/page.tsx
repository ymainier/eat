import { redirect } from "next/navigation";
import { connection } from "next/server";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";

/** Planning happens ahead: open the Meal Week after the current one. */
export default async function PlanPage() {
  await connection();
  const member = await requireMember();
  const current = await application().getCurrentMealWeek({ member });
  redirect(`/meal-weeks/${current.nextStartDate}`);
}
