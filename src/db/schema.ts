import { check, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
