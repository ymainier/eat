import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { AppShell, BackHeader } from "../app-shell";
import { signOut } from "../sign-in/actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const member = await requireMember();
  const settings = await application().getHouseholdSettings({ member });
  const timezones = Intl.supportedValuesOf("timeZone");
  if (!timezones.includes(settings.timezone)) timezones.unshift(settings.timezone);

  return (
    <AppShell>
      <BackHeader href="/" label="Back to this week">
        <h1 className="flex-1 pl-1 font-display text-[26px] font-bold">Household</h1>
      </BackHeader>
      <div className="flex flex-col gap-5 px-4 pt-2">
        {settings.startDayFrom && (
          <p className="rounded-[14px] bg-marker-wash px-3.5 py-3 text-[15px] font-medium text-marker-ink">
            Meal Weeks start on the new start day from {formatDay(settings.startDayFrom)}.
          </p>
        )}
        <SettingsForm settings={settings} timezones={timezones} />
        <p className="px-1 text-sm leading-relaxed text-ink-soft">
          Changes apply to Meal Weeks created from now on. Existing Meal Weeks keep their dates and
          Meal Count; a new start day begins after the latest planned Meal Week, which runs a few
          days longer to meet it.
        </p>
        <form action={signOut} className="flex justify-center border-t border-rule pt-2">
          <button type="submit" className="btn text-ink-soft">
            Sign out
          </button>
        </form>
      </div>
    </AppShell>
  );
}
