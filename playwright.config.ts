import { defineConfig, devices } from "@playwright/test";
import {
  e2eAllowList,
  e2eAuthSecret,
  e2eBaseUrl,
  e2eClockNow,
  e2eDatabaseUrl,
  e2ePort,
} from "./e2e/environment";

export default defineConfig({
  testDir: "./e2e",
  // Every test truncates the shared eat_test database.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Migrates eat_test once, before the app starts.
    command: `tsx scripts/migrate.ts && next dev --port ${e2ePort}`,
    url: `${e2eBaseUrl}/sign-in`,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      BETTER_AUTH_URL: e2eBaseUrl,
      BETTER_AUTH_SECRET: e2eAuthSecret,
      ALLOWED_EMAILS: e2eAllowList.join(","),
      RESEND_API_KEY: "",
      EAT_CLOCK_NOW: e2eClockNow,
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
