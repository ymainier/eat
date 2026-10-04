import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createApplication, type Application } from "../application";
import { fixedClock, systemClock, type Clock } from "../application/clock";
import type { EmailSender } from "../application/email";
import { authOptions } from "../auth/auth-options";
import { createDatabase, type Database } from "../db/client";
import { outboxEmailSender } from "../email/outbox";
import { resendEmailSender } from "../email/resend";

// Composition root for the web app: wires the application layer to real adapters.

function clock(): Clock {
  // Lets e2e tests pin "now"; never honoured in production.
  const now = process.env.EAT_CLOCK_NOW;
  if (now && process.env.NODE_ENV !== "production") return fixedClock(now);
  return systemClock;
}

function emailSender(db: Database): EmailSender {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return resendEmailSender({ apiKey, from: requiredEnv("EMAIL_FROM") });
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY is required in production");
  }
  // Locally, read sign-in links from the email_outbox table.
  return outboxEmailSender(db);
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function compose() {
  const db = createDatabase(requiredEnv("DATABASE_URL")).db;
  const application = createApplication({
    db,
    clock: clock(),
    emailSender: emailSender(db),
    allowList: (process.env.ALLOWED_EMAILS ?? "").split(",").filter(Boolean),
  });
  const options = authOptions({
    db,
    application,
    baseURL: requiredEnv("BETTER_AUTH_URL"),
    secret: requiredEnv("BETTER_AUTH_SECRET"),
  });
  const auth = betterAuth({
    ...options,
    // Must stay last: lets Server Actions set auth cookies.
    plugins: [...options.plugins, nextCookies()],
  });
  return { application, auth };
}

type Composition = ReturnType<typeof compose>;

// Reused across hot reloads so dev doesn't leak connections.
const globalForApp = globalThis as unknown as { eat?: Composition };

function composition() {
  globalForApp.eat ??= compose();
  return globalForApp.eat;
}

export const application = (): Application => composition().application;
export const auth = () => composition().auth;
