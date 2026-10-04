import { connection } from "next/server";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { signOut } from "./sign-in/actions";

export default async function CurrentMealWeekPage() {
  await connection();
  const member = await requireMember();
  const mealWeek = await application().getCurrentMealWeek({ member });

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 flex justify-end">
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-600 underline">
            Sign out
          </button>
        </form>
      </nav>
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
