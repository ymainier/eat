"use client";

import { useActionState } from "react";
import { createDish, renameDish, type DishFormState } from "./actions";

export function CreateDishForm() {
  const [state, action, pending] = useActionState<DishFormState, FormData>(createDish, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="new-dish">
          New Dish
        </label>
        <input
          // Re-mounted after each submission: empty once created, kept when refused.
          key={state.at}
          defaultValue={state.error ? state.name : ""}
          id="new-dish"
          name="name"
          required
          placeholder="New Dish"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
        >
          Create Dish
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function RenameDishForm({ dishId, name }: { dishId: string; name: string }) {
  const [state, action, pending] = useActionState<DishFormState, FormData>(renameDish, {});
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="dishId" value={dishId} />
      <div className="flex gap-2">
        <input
          // Re-mounted after each submission: the stored name once saved, kept when refused.
          key={`${name}-${state.at}`}
          name="name"
          required
          defaultValue={state.error ? state.name : name}
          aria-label={`Name of ${name}`}
          className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 font-medium hover:border-zinc-300 focus:border-zinc-300"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={`Rename ${name}`}
          className="text-sm text-zinc-600 underline disabled:opacity-50"
        >
          Rename
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
