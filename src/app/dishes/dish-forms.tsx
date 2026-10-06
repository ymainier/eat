"use client";

import { useActionState } from "react";
import { PlusIcon } from "../icons";
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
          className="field flex-1"
        />
        <button type="submit" disabled={pending} className="btn btn-pen px-4">
          <PlusIcon size={20} />
          Create Dish
        </button>
      </div>
      {state.error && (
        <p role="alert" className="px-1 font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function RenameDishForm({ dishId, name }: { dishId: string; name: string }) {
  const [state, action, pending] = useActionState<DishFormState, FormData>(renameDish, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="dishId" value={dishId} />
      <div className="flex gap-2">
        <input
          // Re-mounted after each submission: the stored name once saved, kept when refused.
          key={`${name}-${state.at}`}
          name="name"
          required
          defaultValue={state.error ? state.name : name}
          aria-label={`Name of ${name}`}
          className="field flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={`Rename ${name}`}
          className="btn btn-ghost px-4"
        >
          Rename
        </button>
      </div>
      {state.error && (
        <p role="alert" className="px-1 font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
