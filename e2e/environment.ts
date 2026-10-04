export const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ?? "postgres://eat:eat@localhost:5432/eat_test";

/** "Now" for the app under test: Monday 5 Oct 2026, in the Meal Week Sat 3 – Fri 9 Oct. */
export const e2eClockNow = "2026-10-05T12:00:00Z";
