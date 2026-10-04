import { connection } from "next/server";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import { MealWeekPage } from "./meal-week-page";

export default async function CurrentMealWeekPage() {
  await connection();
  const member = await requireMember();
  const app = application();
  const [mealWeek, dishes] = await Promise.all([
    app.getCurrentMealWeek({ member }),
    app.listDishes({ member }),
  ]);
  return <MealWeekPage mealWeek={mealWeek} dishes={dishes} />;
}
