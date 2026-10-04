import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
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

export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Set when the Dish is archived: withdrawn from planning, kept in history.
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // Dish names are unique within a Household, ignoring case.
    uniqueIndex("dishes_household_name_unique").on(t.householdId, sql`lower(${t.name})`),
  ],
);

export const mealWeeks = pgTable(
  "meal_weeks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    // Copied from the Household's settings when the Meal Week is created.
    mealCount: integer("meal_count").notNull(),
    // When a Member carried Meals over from this Meal Week, or dismissed doing so.
    carryOverHandledAt: timestamp("carry_over_handled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("meal_weeks_household_start_unique").on(t.householdId, t.startDate)],
);

export const meals = pgTable(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mealWeekId: uuid("meal_week_id")
      .notNull()
      .references(() => mealWeeks.id, { onDelete: "cascade" }),
    dishId: uuid("dish_id")
      .notNull()
      // NO ACTION (the default) still forbids deleting a Dish in use, but checks
      // at the end of the statement, so cascades from a Household can complete.
      .references(() => dishes.id),
    eaten: boolean("eaten").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("meals_meal_week_idx").on(t.mealWeekId)],
);

// A Tag has no table of its own: it exists only while a Dish carries it.
export const dishTags = pgTable(
  "dish_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("dish_tags_dish_name_unique").on(t.dishId, sql`lower(${t.name})`)],
);
