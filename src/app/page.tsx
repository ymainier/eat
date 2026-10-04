import { connection } from "next/server";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { removeMeal } from "./meal-week-actions";
import { PlanMealForm } from "./plan-meal-form";
import { signOut } from "./sign-in/actions";

export default async function CurrentMealWeekPage() {
  await connection();
  const member = await requireMember();
  const app = application();
  const [mealWeek, dishes] = await Promise.all([
    app.getCurrentMealWeek({ member }),
    app.listDishes({ member }),
  ]);

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 flex justify-end">
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-600 underline">
            Sign out
          </button>
        </form>
      </nav>
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold">
          {formatDay(mealWeek.startDate)} – {formatDay(mealWeek.endDate)}
        </h1>
        <p
          aria-label="Meals planned against the Meal Count"
          className="text-zinc-600"
        >
          {mealWeek.plannedMealCount} / {mealWeek.mealCount}
        </p>
      </header>

      <PlanMealForm dishNames={dishes.map((dish) => dish.name)} />

      {mealWeek.meals.length === 0 ? (
        <p className="mt-8 text-zinc-500">No Meals planned yet.</p>
      ) : (
        <ul aria-label="Meals" className="mt-6 divide-y divide-zinc-200">
          {mealWeek.meals.map((meal) => (
            <li key={meal.id} className="flex items-center justify-between gap-4 py-3">
              <span>{meal.dish.name}</span>
              <form action={removeMeal}>
                <input type="hidden" name="mealId" value={meal.id} />
                <button
                  type="submit"
                  aria-label={`Remove ${meal.dish.name}`}
                  className="text-sm text-zinc-500 underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
