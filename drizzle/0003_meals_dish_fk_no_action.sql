ALTER TABLE "meals" DROP CONSTRAINT "meals_dish_id_dishes_id_fk";
--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE no action ON UPDATE no action;