CREATE TABLE "start_day_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"from" date NOT NULL,
	"start_day" integer NOT NULL,
	CONSTRAINT "start_day_changes_start_day_check" CHECK ("start_day_changes"."start_day" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "households" DROP CONSTRAINT "households_start_day_check";--> statement-breakpoint
ALTER TABLE "start_day_changes" ADD CONSTRAINT "start_day_changes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "start_day_changes_household_from_unique" ON "start_day_changes" USING btree ("household_id","from");--> statement-breakpoint
-- Existing Households keep their start day: one schedule entry from the first
-- such day on or after 2000-01-01 (a Saturday), covering all earlier dates too.
INSERT INTO "start_day_changes" ("household_id", "from", "start_day")
SELECT "id", date '2000-01-01' + (("start_day" - 6 + 7) % 7), "start_day" FROM "households";--> statement-breakpoint
ALTER TABLE "households" DROP COLUMN "start_day";