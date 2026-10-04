import Link from "next/link";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const member = await requireMember();
  const settings = await application().getHouseholdSettings({ member });
  const timezones = Intl.supportedValuesOf("timeZone");
  if (!timezones.includes(settings.timezone)) timezones.unshift(settings.timezone);

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 text-sm">
        <Link href="/" className="underline">
          ← Current Meal Week
        </Link>
      </nav>
      <h1 className="mb-2 text-xl font-semibold">Household settings</h1>
      <p className="mb-4 text-sm text-zinc-600">
        Changes apply to Meal Weeks created from now on. Existing Meal Weeks keep their
        dates and Meal Count; a new start day begins after the latest planned Meal Week,
        which runs a few days longer to meet it.
      </p>
      {settings.startDayFrom && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-zinc-900">
          Meal Weeks start on the new start day from {formatDay(settings.startDayFrom)}.
        </p>
      )}
      <SettingsForm settings={settings} timezones={timezones} />
    </main>
  );
}
