import { connection } from "next/server";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { removeMeal, setMealEaten } from "./meal-week-actions";
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

      {mealWeek.plannedMealCount > 0 && (
        <p aria-label="Meals eaten and left" className="mt-6 text-sm text-zinc-600">
          {mealWeek.eatenMealCount} eaten ·{" "}
          {mealWeek.plannedMealCount - mealWeek.eatenMealCount} left
        </p>
      )}

      {mealWeek.meals.length === 0 ? (
        <p className="mt-8 text-zinc-500">No Meals planned yet.</p>
      ) : (
        <ul aria-label="Meals" className="mt-2 divide-y divide-zinc-200">
          {mealWeek.meals.map((meal) => (
            <li key={meal.id} className="flex items-center gap-3 py-3">
              <form action={setMealEaten}>
                <input type="hidden" name="mealId" value={meal.id} />
                <input type="hidden" name="eaten" value={String(!meal.eaten)} />
                <button
                  type="submit"
                  aria-pressed={meal.eaten}
                  aria-label={`${meal.dish.name} eaten`}
                  className={`flex size-7 items-center justify-center rounded-full border-2 ${
                    meal.eaten
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-400"
                  }`}
                >
                  {meal.eaten && <span aria-hidden>✓</span>}
                </button>
              </form>
              <span
                className={`flex-1 ${
                  meal.eaten ? "text-zinc-400 line-through" : "font-medium"
                }`}
              >
                {meal.dish.name}
              </span>
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
