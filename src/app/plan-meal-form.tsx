"use client";

import { useActionState } from "react";
import { planMeal, type PlanMealState } from "./meal-week-actions";

/** Adds a Meal by Dish name; the browser suggests existing Dishes as you type. */
export function PlanMealForm({ dishNames }: { dishNames: string[] }) {
  const [state, action, pending] = useActionState<PlanMealState, FormData>(
    planMeal,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="dishName">
          Dish
        </label>
        <input
          id="dishName"
          name="dishName"
          list="dish-names"
          required
          autoComplete="off"
          placeholder="Add a Dish, e.g. leftovers"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2"
        />
        <datalist id="dish-names">
          {dishNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Add Meal
        </button>
      </div>
      {state.error && (
        <p className="text-red-700" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
