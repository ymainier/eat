"use client";

import { useActionState } from "react";
import type { HouseholdSettings } from "@/application";
import { saveSettings, type SettingsFormState } from "./actions";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SettingsForm({
  settings,
  timezones,
}: {
  settings: HouseholdSettings;
  timezones: string[];
}) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(
    saveSettings,
    {},
  );

  return (
    // Re-mounted after saving so the fields show the stored settings.
    <form key={state.saved} action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Meal Week start day
        <select
          name="startDay"
          defaultValue={settings.startDay}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          {days.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Meal Count
        <input
          name="mealCount"
          type="number"
          min={1}
          max={99}
          required
          defaultValue={settings.mealCount}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        Timezone
        <select
          name="timezone"
          defaultValue={settings.timezone}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          {timezones.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </select>
      </label>
      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p role="status" className="text-emerald-700">
          Settings saved.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
      >
        Save settings
      </button>
    </form>
  );
}
