import type { CarryOverCandidates } from "@/application";
import { formatDay } from "@/web/format";
import { carryOver, dismissCarryOver } from "./meal-week-actions";

export function CarryOverPrompt({ candidates }: { candidates: CarryOverCandidates }) {
  return (
    <section
      aria-labelledby="carry-over-title"
      className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-zinc-900"
    >
      <h2 id="carry-over-title" className="font-semibold">
        Carry Over
      </h2>
      <p className="mb-3 text-sm text-zinc-600">
        These Meals from {formatDay(candidates.startDate)} – {formatDay(candidates.endDate)}{" "}
        weren&apos;t eaten. Choose the ones to move into this Meal Week; the rest stay
        behind as not eaten.
      </p>
      <form action={carryOver} className="flex flex-col gap-3">
        <input type="hidden" name="fromStartDate" value={candidates.startDate} />
        <ul className="flex flex-col gap-1">
          {candidates.meals.map((meal) => (
            <li key={meal.id}>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="mealId" value={meal.id} defaultChecked />
                {meal.dish.name}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button type="submit" className="rounded bg-zinc-900 px-3 py-2 text-white">
            Carry Over
          </button>
          <button
            type="submit"
            formAction={dismissCarryOver}
            className="rounded px-3 py-2 underline"
          >
            Dismiss
          </button>
        </div>
      </form>
    </section>
  );
}
