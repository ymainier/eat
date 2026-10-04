import Link from "next/link";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";

export default async function HistoryPage() {
  const member = await requireMember();
  const history = await application().listPastMealWeeks({ member });

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 text-sm">
        <Link href="/" className="underline">
          ← Current Meal Week
        </Link>
      </nav>
      <h1 className="mb-4 text-xl font-semibold">History</h1>
      {history.length === 0 ? (
        <p className="text-zinc-500">No past Meal Weeks yet.</p>
      ) : (
        <ul aria-label="Past Meal Weeks" className="divide-y divide-zinc-200">
          {history.map((week) => (
            <li key={week.startDate}>
              <Link
                href={`/meal-weeks/${week.startDate}`}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span className="font-medium underline">
                  {formatDay(week.startDate)} – {formatDay(week.endDate)}
                </span>
                <span className="text-sm text-zinc-600">
                  {week.eatenMealCount} eaten · {week.plannedMealCount} / {week.mealCount}{" "}
                  planned
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
