import { notFound } from "next/navigation";
import { MealWeekNotFoundError } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import { MealWeekPage } from "../../meal-week-page";

export default async function MealWeekByStartDatePage({
  params,
}: PageProps<"/meal-weeks/[startDate]">) {
  const { startDate } = await params;
  const member = await requireMember();
  const app = application();
  const [mealWeek, dishes] = await Promise.all([
    app.getMealWeek({ member, startDate }).catch((error) => {
      if (error instanceof MealWeekNotFoundError) notFound();
      throw error;
    }),
    app.listDishes({ member }),
  ]);
  return <MealWeekPage mealWeek={mealWeek} dishes={dishes} />;
}
