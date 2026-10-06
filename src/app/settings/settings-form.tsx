"use client";

import { useActionState, useState } from "react";
import type { HouseholdSettings } from "@/application";
import { MinusIcon, PlusIcon } from "../icons";
import { saveSettings, type SettingsFormState } from "./actions";

// Monday first, as on a kitchen calendar; values are Date#getDay() numbers.
const days = [
  { value: 1, name: "Monday" },
  { value: 2, name: "Tuesday" },
  { value: 3, name: "Wednesday" },
  { value: 4, name: "Thursday" },
  { value: 5, name: "Friday" },
  { value: 6, name: "Saturday" },
  { value: 0, name: "Sunday" },
];

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
    <form key={state.saved} action={action} className="flex flex-col gap-5">
      <MealCountField initial={settings.mealCount} />

      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2 px-1">Meal Week start day</legend>
        <div className="card flex gap-0.5 p-1">
          {days.map((day) => (
            <label key={day.value} className="flex-1">
              <input
                type="radio"
                name="startDay"
                value={day.value}
                defaultChecked={settings.startDay === day.value}
                aria-label={day.name}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] text-[15px] font-medium peer-checked:bg-pen peer-checked:font-bold peer-checked:text-on-pen peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pen"
              >
                {day.name.slice(0, 3)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="label flex flex-col gap-2 px-1">
        Timezone
        <select
          name="timezone"
          defaultValue={settings.timezone}
          className="field -mx-1 w-auto font-normal text-ink"
        >
          {timezones.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p role="alert" className="px-1 font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p role="status" className="px-1 font-bold text-pen">
          Settings saved.
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-pen">
        Save settings
      </button>
    </form>
  );
}

function MealCountField({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  const clamp = (value: number) => Math.min(99, Math.max(1, value));

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="mealCount" className="label px-1">
        Meal Count
      </label>
      <div className="card flex items-center justify-between py-2.5 pr-3 pl-4">
        <span className="max-w-40 leading-snug">Meals to plan each Meal Week</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Fewer Meals"
            onClick={() => setCount((value) => clamp(value - 1))}
            className="grid size-13 cursor-pointer place-items-center rounded-[14px] border-[1.5px] border-rule-strong bg-sheet"
          >
            <MinusIcon size={20} />
          </button>
          <input
            id="mealCount"
            name="mealCount"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            required
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            className="w-14 [appearance:textfield] bg-transparent text-center font-hand text-[40px] leading-none font-bold text-pen [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="More Meals"
            onClick={() => setCount((value) => clamp(value + 1))}
            className="grid size-13 cursor-pointer place-items-center rounded-[14px] border-[1.5px] border-rule-strong bg-sheet"
          >
            <PlusIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
