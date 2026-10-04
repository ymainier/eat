import Link from "next/link";
import type { CarryOverCandidates, DishView, MealWeekView } from "@/application";
import { formatDay } from "@/web/format";
import { CarryOverPrompt } from "./carry-over-prompt";
import { removeMeal, setMealEaten } from "./meal-week-actions";
import { PlanMealForm } from "./plan-meal-form";
import { signOut } from "./sign-in/actions";

const mealWeekHref = (startDate: string) => `/meal-weeks/${startDate}`;

const relationLabel = {
  past: "Past Meal Week",
  current: "Current Meal Week",
  future: "Future Meal Week",
} as const;

export function MealWeekPage({
  mealWeek,
  dishes,
  carryOverCandidates,
}: {
  mealWeek: MealWeekView;
  dishes: DishView[];
  /** Offered on the current Meal Week only. */
  carryOverCandidates?: CarryOverCandidates | null;
}) {
  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 flex justify-end gap-4 text-sm">
        <Link href="/dishes" className="text-zinc-600 underline">
          Dishes
        </Link>
        <Link href="/history" className="text-zinc-600 underline">
          History
        </Link>
        <Link href="/settings" className="text-zinc-600 underline">
          Settings
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-600 underline">
            Sign out
          </button>
        </form>
      </nav>

      <nav aria-label="Meal Weeks" className="mb-2 flex items-center justify-between text-sm">
        <Link href={mealWeekHref(mealWeek.previousStartDate)} className="underline">
          ← Previous
        </Link>
        {mealWeek.relation !== "current" && (
          <Link href="/" className="underline">
            Current Meal Week
          </Link>
        )}
        <Link href={mealWeekHref(mealWeek.nextStartDate)} className="underline">
          Next →
        </Link>
      </nav>

      <p className="text-sm text-zinc-500">{relationLabel[mealWeek.relation]}</p>
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

      {carryOverCandidates && <CarryOverPrompt candidates={carryOverCandidates} />}

      <PlanMealForm
        mealWeekStartDate={mealWeek.startDate}
        dishNames={dishes.map((dish) => dish.name)}
      />

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
              <div className="flex flex-1 flex-col">
                <span
                  className={meal.eaten ? "text-zinc-400 line-through" : "font-medium"}
                >
                  {meal.dish.name}
                  {meal.dish.hasRecipe && (
                    <Link
                      href={`/dishes/${meal.dish.id}`}
                      aria-label={`Recipe for ${meal.dish.name}`}
                      className="ml-2 text-sm font-normal text-emerald-700 underline"
                    >
                      Recipe
                    </Link>
                  )}
                </span>
                {meal.dish.tags.length > 0 && (
                  <span className="text-xs text-zinc-500">{meal.dish.tags.join(" · ")}</span>
                )}
              </div>
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
