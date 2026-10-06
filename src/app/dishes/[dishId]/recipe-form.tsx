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
      <label className="label flex flex-col gap-1.5">
        Ingredients
        <textarea
          name="ingredients"
          rows={6}
          defaultValue={values.ingredients}
          className="field py-3 font-normal text-ink"
        />
      </label>
      <label className="label flex flex-col gap-1.5">
        Steps
        <textarea
          name="steps"
          rows={8}
          defaultValue={values.steps}
          className="field py-3 font-normal text-ink"
        />
      </label>
      <label className="label flex flex-col gap-1.5">
        Source URL (optional)
        <input
          name="sourceUrl"
          inputMode="url"
          defaultValue={values.sourceUrl}
          className="field py-3 font-normal text-ink"
        />
      </label>
      {state.error && (
        <p role="alert" className="font-medium text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-pen self-start"
      >
        Save Recipe
      </button>
    </form>
  );
}
