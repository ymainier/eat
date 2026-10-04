import { connection } from "next/server";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";

export default async function CurrentMealWeekPage() {
  await connection();
  const app = application();
  const householdId = await app.findSoleHouseholdId();
  if (!householdId) {
    return (
      <main className="mx-auto w-full max-w-xl p-4">
        <p>
          No Household yet. Run <code>npm run db:seed</code>.
        </p>
      </main>
    );
  }
  const mealWeek = await app.getCurrentMealWeek({ householdId });

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold">
          {formatDay(mealWeek.startDate)} – {formatDay(mealWeek.endDate)}
        </h1>
        <p
          aria-label="Meals planned against the Meal Count"
          className="text-zinc-600"
        >
          {mealWeek.plannedMealCount} / {mealWeek.mealCount}
        </p>
      </header>
      <p className="mt-8 text-zinc-500">No Meals planned yet.</p>
    </main>
  );
}
