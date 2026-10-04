"use client";

import { useActionState } from "react";
import type { Recipe } from "@/application";
import { saveRecipe, type RecipeFormState } from "./actions";

export function RecipeForm({ dishId, recipe }: { dishId: string; recipe: Recipe | null }) {
  const [state, action, pending] = useActionState<RecipeFormState, FormData>(saveRecipe, {});
  // Fields re-mount after each submission: showing the stored Recipe once
  // saved, or what was typed when refused.
  const values = state.values ?? {
    ingredients: recipe?.ingredients ?? "",
    steps: recipe?.steps ?? "",
    sourceUrl: recipe?.sourceUrl ?? "",
  };

  return (
    <form key={state.at} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="dishId" value={dishId} />
      <label className="flex flex-col gap-1">
        Ingredients
        <textarea
          name="ingredients"
          rows={6}
          defaultValue={values.ingredients}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        Steps
        <textarea
          name="steps"
          rows={8}
          defaultValue={values.steps}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        Source URL (optional)
        <input
          name="sourceUrl"
          inputMode="url"
          defaultValue={values.sourceUrl}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
      >
        Save Recipe
      </button>
    </form>
  );
}
