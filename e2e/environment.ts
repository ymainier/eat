export const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ?? "postgres://eat:eat@localhost:5432/eat_test";

export const e2ePort = 3100;
export const e2eBaseUrl = `http://localhost:${e2ePort}`;

/** "Now" for the app under test: Monday 5 Oct 2026, in the Meal Week Sat 3 – Fri 9 Oct. */
export const e2eClockNow = "2026-10-05T12:00:00Z";

export const e2eAuthSecret = "e2e-only-secret-not-used-anywhere-else-0123456789";

export const memberEmail = "member@example.com";
export const otherMemberEmail = "other.member@example.com";
export const e2eAllowList = [memberEmail, otherMemberEmail];
