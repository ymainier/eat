"use client";

import { useActionState, useId, useRef, useState, type KeyboardEvent } from "react";
import { PlusIcon, SearchIcon } from "./icons";
import { planMeal, type PlanMealState } from "./meal-week-actions";

export type DishSuggestion = { name: string; tags: string[] };

/** Adds a Meal by Dish name, suggesting existing Dishes as you type. */
export function PlanMealForm({
  mealWeekStartDate,
  dishes,
}: {
  mealWeekStartDate: string;
  dishes: DishSuggestion[];
}) {
  const [state, action, pending] = useActionState<PlanMealState, FormData>(planMeal, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="mealWeekStartDate" value={mealWeekStartDate} />
      <label htmlFor="dishName" className="label px-1">
        Add a Dish
      </label>
      <div className="flex gap-2">
        <DishCombobox
          // Re-mounted after each submission: empty once planned, kept when refused.
          key={state.at}
          initialQuery={state.error ? (state.dishName ?? "") : ""}
          dishes={dishes}
          onPick={() => formRef.current?.requestSubmit()}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Add Meal"
          className="btn btn-pen w-13 shrink-0 px-0"
        >
          <PlusIcon />
        </button>
      </div>
      {state.error && (
        <p className="px-1 font-medium text-danger" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

type Option = { kind: "dish"; dish: DishSuggestion } | { kind: "new"; name: string };

function DishCombobox({
  initialQuery,
  dishes,
  onPick,
}: {
  initialQuery: string;
  dishes: DishSuggestion[];
  onPick: () => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const typed = query.trim();
  const needle = typed.toLowerCase();
  const matches = needle
    ? dishes
        .filter((dish) => dish.name.toLowerCase().includes(needle))
        .sort(
          (a, b) =>
            Number(!a.name.toLowerCase().startsWith(needle)) -
              Number(!b.name.toLowerCase().startsWith(needle)) ||
            a.name.localeCompare(b.name),
        )
        .slice(0, 5)
    : [];
  const exists = dishes.some((dish) => dish.name.toLowerCase() === needle);
  const options: Option[] = [
    ...matches.map((dish) => ({ kind: "dish" as const, dish })),
    ...(typed && !exists ? [{ kind: "new" as const, name: typed }] : []),
  ];
  const expanded = open && options.length > 0;

  const pick = (option: Option) => {
    const name = option.kind === "dish" ? option.dish.name : option.name;
    // Set the field before submitting so the form sends the picked name.
    if (inputRef.current) inputRef.current.value = name;
    setQuery(name);
    setOpen(false);
    onPick();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      // Cycles through the options and back to the field itself (-1).
      setActive((index) => ((index + 1 + step + options.length + 1) % (options.length + 1)) - 1);
    } else if (event.key === "Enter" && expanded && options[active]) {
      event.preventDefault();
      pick(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative flex-1">
      <SearchIcon className="pointer-events-none absolute top-[15px] left-3.5 text-ink-soft" size={22} />
      <input
        ref={inputRef}
        id="dishName"
        name="dishName"
        required
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && options[active] ? `${listId}-${active}` : undefined}
        placeholder="e.g. risotto, leftovers"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="field pl-11.5"
      />
      <ul
        id={listId}
        role="listbox"
        hidden={!expanded}
        className="card absolute inset-x-0 top-full z-20 mt-1.5 p-1.5 shadow-[0_14px_30px_-12px_rgb(31_42_53/0.35)]"
      >
        {options.map((option, index) => (
          <li
            key={option.kind === "dish" ? option.dish.name : "new"}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            // Keep focus in the field so the list stays open until the pick.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(option)}
            className={`flex min-h-13 cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-1.5 hover:bg-pen-wash aria-selected:bg-pen-wash ${
              option.kind === "new" ? "mt-1 border-t border-rule font-bold text-pen" : ""
            }`}
          >
            {option.kind === "dish" ? (
              <>
                <Highlighted text={option.dish.name} needle={needle} />
                {option.dish.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </>
            ) : (
              <>
                <PlusIcon size={20} />
                New Dish “{option.name}”
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Highlighted({ text, needle }: { text: string; needle: string }) {
  const start = text.toLowerCase().indexOf(needle);
  if (start < 0) return <span className="flex-1 text-[17px]">{text}</span>;
  const end = start + needle.length;
  return (
    <span className="flex-1 text-[17px]">
      {text.slice(0, start)}
      <mark className="bg-transparent font-bold text-ink underline decoration-2 underline-offset-3">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </span>
  );
}
