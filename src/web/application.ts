import { createApplication, type Application } from "../application";
import { fixedClock, systemClock, type Clock } from "../application/clock";
import { createDatabase } from "../db/client";

// Composition root for the web app: wires the application layer to real adapters.

const globalForApp = globalThis as unknown as { eatApplication?: Application };

function clock(): Clock {
  // Lets e2e tests pin "now"; never honoured in production.
  const now = process.env.EAT_CLOCK_NOW;
  if (now && process.env.NODE_ENV !== "production") return fixedClock(now);
  return systemClock;
}

export function application(): Application {
  // Reused across hot reloads so dev doesn't leak connections.
  globalForApp.eatApplication ??= createApplication({
    db: createDatabase(process.env.DATABASE_URL!).db,
    clock: clock(),
  });
  return globalForApp.eatApplication;
}
