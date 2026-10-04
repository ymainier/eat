import { defineConfig, devices } from "@playwright/test";
import { e2eClockNow, e2eDatabaseUrl } from "./e2e/environment";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  // Every test truncates the shared eat_test database.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Migrates eat_test once, before the app starts.
    command: `tsx scripts/migrate.ts && next dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      EAT_CLOCK_NOW: e2eClockNow,
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
