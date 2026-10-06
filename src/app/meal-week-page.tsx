import Link from "next/link";
import type {
  CarryOverCandidates,
  CatalogueDish,
  MealView,
  MealWeekView,
} from "@/application";
import { formatDay } from "@/web/format";
import { AppShell } from "./app-shell";
import { CarryOverPrompt } from "./carry-over-prompt";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HouseIcon,
} from "./icons";
import { removeMeal, setMealEaten } from "./meal-week-actions";
import { PlanMealForm } from "./plan-meal-form";

const mealWeekHref = (startDate: string) => `/meal-weeks/${startDate}`;

const relationLabel = {
  past: "Past Meal Week",
  current: "This Meal Week",
  future: "Future Meal Week",
} as const;

const section = { past: "history", current: "week", future: "plan" } as const;

export function MealWeekPage({
  mealWeek,
  dishes,
  carryOverCandidates,
}: {
  mealWeek: MealWeekView;
  dishes: CatalogueDish[];
  /** Offered on the current Meal Week only. */
  carryOverCandidates?: CarryOverCandidates | null;
}) {
  const left = mealWeek.plannedMealCount - mealWeek.eatenMealCount;
  // Still to eat first; eaten Meals sink to the bottom.
  const meals = [
    ...mealWeek.meals.filter((meal) => !meal.eaten),
    ...mealWeek.meals.filter((meal) => meal.eaten),
  ];

  return (
    <AppShell current={section[mealWeek.relation]}>
      <header className="px-2 pt-2.5">
        <div className="flex items-center justify-between pl-3">
          <p className="text-sm font-bold text-ink-soft">{relationLabel[mealWeek.relation]}</p>
          <Link href="/settings" aria-label="Household settings" className="icon-btn">
            <HouseIcon />
          </Link>
        </div>
        <div className="relative">
          <h1 className="px-12 text-center font-display text-[26px] leading-tight font-bold">
            {formatDay(mealWeek.startDate)} – {formatDay(mealWeek.endDate)}
          </h1>
          <nav
            aria-label="Meal Weeks"
            className="pointer-events-none absolute inset-0 flex items-center justify-between"
          >
            <Link
              href={mealWeekHref(mealWeek.previousStartDate)}
              aria-label="Previous Meal Week"
              className="icon-btn pointer-events-auto"
            >
              <ChevronLeftIcon />
            </Link>
            <Link
              href={mealWeekHref(mealWeek.nextStartDate)}
              aria-label="Next Meal Week"
              className="icon-btn pointer-events-auto"
            >
              <ChevronRightIcon />
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-3">
        {carryOverCandidates && <CarryOverPrompt candidates={carryOverCandidates} />}

        <section aria-label="Progress" className="card flex flex-col gap-3 px-4 pt-3.5 pb-4">
          <div className="flex items-baseline gap-2.5">
            <p
              aria-label="Meals planned against the Meal Count"
              className="font-hand text-[54px] leading-[0.9] font-bold text-pen"
            >
              {mealWeek.plannedMealCount} / {mealWeek.mealCount}
            </p>
            <span className="text-[15px] font-medium text-ink-soft">Meals planned</span>
          </div>
          <ProgressDots
            eaten={mealWeek.eatenMealCount}
            planned={mealWeek.plannedMealCount}
            target={mealWeek.mealCount}
          />
          {mealWeek.plannedMealCount > 0 && (
            <p aria-label="Meals eaten and left" className="text-[17px] font-bold">
              {mealWeek.eatenMealCount} eaten <span className="font-normal text-ink-soft">·</span>{" "}
              {left} left
            </p>
          )}
        </section>

        <PlanMealForm
          mealWeekStartDate={mealWeek.startDate}
          dishes={dishes.map((dish) => ({ name: dish.name, tags: dish.tags }))}
        />

        {meals.length === 0 ? (
          <p className="py-8 text-center font-hand text-[28px] font-semibold text-ink-soft">
            No Meals planned yet.
          </p>
        ) : (
          <ul aria-label="Meals" className="flex flex-col gap-2 pt-1">
            {meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

/** One dot per Meal Count slot: filled when eaten, ringed when planned, dashed when free. */
function ProgressDots({ eaten, planned, target }: { eaten: number; planned: number; target: number }) {
  const slots = Array.from({ length: Math.max(target, planned) }, (_, index) =>
    index < eaten ? "bg-pen" : index < planned ? "border-2 border-pen" : "border-2 border-dashed border-rule-strong",
  );
  return (
    <div aria-hidden className="flex flex-wrap gap-1.5">
      {slots.map((style, index) => (
        <span key={index} className={`size-4 rounded-full ${style}`} />
      ))}
    </div>
  );
}

function MealRow({ meal }: { meal: MealView }) {
  const { dish, eaten } = meal;
  return (
    <li
      className={`flex min-h-15 items-center gap-1 rounded-[14px] border py-1.5 pl-1.5 ${
        eaten ? "border-transparent" : "border-rule bg-sheet"
      }`}
    >
      <form action={setMealEaten}>
        <input type="hidden" name="mealId" value={meal.id} />
        <input type="hidden" name="eaten" value={String(!eaten)} />
        <button
          type="submit"
          aria-pressed={eaten}
          aria-label={`${dish.name} eaten`}
          className="grid size-12 cursor-pointer place-items-center rounded-xl"
        >
          <span
            className={`grid size-7.5 place-items-center rounded-full border-2 ${
              eaten ? "border-pen bg-pen text-on-pen" : "border-ink-soft text-transparent"
            }`}
          >
            <CheckIcon size={18} />
          </span>
        </button>
      </form>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`text-lg leading-snug ${
            eaten ? "text-done line-through decoration-2" : "font-medium"
          }`}
        >
          {dish.name}
        </span>
        {(dish.tags.length > 0 || dish.hasRecipe) && (
          <span className="flex flex-wrap items-center gap-1.5">
            {dish.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
            {dish.hasRecipe && (
              <Link
                href={`/dishes/${dish.id}`}
                aria-label={`Recipe for ${dish.name}`}
                className="-my-2.5 inline-flex min-h-11 items-center px-1 text-[13px] font-bold text-pen underline underline-offset-2"
              >
                Recipe
              </Link>
            )}
          </span>
        )}
      </div>
      <form action={removeMeal}>
        <input type="hidden" name="mealId" value={meal.id} />
        <button
          type="submit"
          aria-label={`Remove ${dish.name}`}
          className="icon-btn text-ink-soft"
        >
          <CloseIcon size={20} />
        </button>
      </form>
    </li>
  );
}
