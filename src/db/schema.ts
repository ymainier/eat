import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const households = pgTable(
  "households",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // 0 = Sunday … 6 = Saturday
    startDay: integer("start_day").notNull(),
    mealCount: integer("meal_count").notNull(),
    // IANA timezone, e.g. "Europe/London"
    timezone: text("timezone").notNull(),
  },
  (t) => [
    check("households_start_day_check", sql`${t.startDay} between 0 and 6`),
    check("households_meal_count_check", sql`${t.mealCount} >= 0`),
  ],
);

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  // The Better Auth user this Member signs in as.
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Emails "sent" by the outbox Email sender, used in tests and local development.
export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
