"use client";

import { useState } from "react";
import type { CarryOverCandidates } from "@/application";
import { formatDay } from "@/web/format";
import { CarryOverIcon } from "./icons";
import { carryOver, dismissCarryOver } from "./meal-week-actions";

const meals = (count: number) => (count === 1 ? "1 Meal" : `${count} Meals`);

/** The one loud thing on the page: last Meal Week's uneaten Meals, to bring along or leave. */
export function CarryOverPrompt({ candidates }: { candidates: CarryOverCandidates }) {
  const [picked, setPicked] = useState(() => new Set(candidates.meals.map((meal) => meal.id)));
  const toggle = (mealId: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (!next.delete(mealId)) next.add(mealId);
      return next;
    });

  return (
    <section
      aria-label="Carry Over"
      className="flex flex-col gap-3 rounded-[20px] border-2 border-marker bg-marker-wash px-3.5 pt-4 pb-3.5 shadow-[0_6px_0_-2px_var(--color-marker)]"
    >
      <div className="flex items-start gap-3 px-0.5 text-marker-ink">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marker text-on-marker">
          <CarryOverIcon size={22} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-[21px] leading-tight font-bold">
            {meals(candidates.meals.length)} {candidates.meals.length === 1 ? "wasn’t" : "weren’t"}{" "}
            eaten last week
          </h2>
          <p className="text-[15px]">
            {formatDay(candidates.startDate)} – {formatDay(candidates.endDate)}. Pick the ones to
            carry into this week; the rest stay behind as not eaten.
          </p>
        </div>
      </div>
      <form action={carryOver} className="flex flex-col gap-3">
        <input type="hidden" name="fromStartDate" value={candidates.startDate} />
        <ul className="flex flex-col gap-1.5">
          {candidates.meals.map((meal) => (
            <li key={meal.id}>
              <label className="flex min-h-13 cursor-pointer items-center gap-3 rounded-xl bg-sheet px-3 py-1">
                <input
                  type="checkbox"
                  name="mealId"
                  value={meal.id}
                  checked={picked.has(meal.id)}
                  onChange={() => toggle(meal.id)}
                  className="size-6 shrink-0 cursor-pointer accent-marker"
                />
                <span className="flex-1 text-[17px] font-medium">{meal.dish.name}</span>
                {meal.dish.tags[0] && <span className="chip">{meal.dish.tags[0]}</span>}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <button type="submit" className="btn flex-1 bg-marker text-on-marker">
            {picked.size === 0 ? "Carry Over nothing" : `Carry Over ${meals(picked.size)}`}
          </button>
          <button
            type="submit"
            formAction={dismissCarryOver}
            className="btn px-4 text-marker-ink"
          >
            Skip
          </button>
        </div>
      </form>
    </section>
  );
}
