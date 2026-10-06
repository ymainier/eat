import Link from "next/link";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { AppShell } from "../app-shell";
import { ChevronRightIcon } from "../icons";

export default async function HistoryPage() {
  const member = await requireMember();
  const history = await application().listPastMealWeeks({ member });

  return (
    <AppShell current="history">
      <header className="px-5 pt-4.5 pb-2.5">
        <h1 className="font-display text-[30px] leading-tight font-bold">History</h1>
      </header>
      <div className="px-4 pt-1">
        {history.length === 0 ? (
          <p className="py-8 text-center font-hand text-[28px] font-semibold text-ink-soft">
            No past Meal Weeks yet.
          </p>
        ) : (
          <ul aria-label="Past Meal Weeks" className="flex flex-col gap-2.5">
            {history.map((week) => {
              const notEaten = week.plannedMealCount - week.eatenMealCount;
              return (
                <li key={week.startDate} className="card">
                  <Link
                    href={`/meal-weeks/${week.startDate}`}
                    className="flex flex-col gap-2.5 px-4 py-3.5"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg font-bold">
                        {formatDay(week.startDate)} – {formatDay(week.endDate)}
                      </span>
                      <ChevronRightIcon className="shrink-0 text-ink-soft" size={22} />
                    </span>
                    <span aria-hidden className="flex flex-wrap gap-1">
                      {Array.from({ length: week.plannedMealCount }, (_, index) => (
                        <span
                          key={index}
                          className={`size-2.5 rounded-full ${
                            index < week.eatenMealCount ? "bg-pen" : "border-2 border-pen"
                          }`}
                        />
                      ))}
                    </span>
                    <span className="flex items-baseline gap-3">
                      <span className="font-hand text-[26px] leading-none font-bold text-pen">
                        {week.plannedMealCount} / {week.mealCount}
                      </span>
                      <span className="text-[15px] text-ink-soft">
                        {week.eatenMealCount} eaten · {notEaten} not eaten
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
