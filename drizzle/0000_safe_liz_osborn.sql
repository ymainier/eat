CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_day" integer NOT NULL,
	"meal_count" integer NOT NULL,
	"timezone" text NOT NULL,
	CONSTRAINT "households_start_day_check" CHECK ("households"."start_day" between 0 and 6),
	CONSTRAINT "households_meal_count_check" CHECK ("households"."meal_count" >= 0)
);
