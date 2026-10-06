import { notFound } from "next/navigation";
import { DishNotFoundError } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import { AppShell, BackHeader } from "../../app-shell";
import { ExternalIcon } from "../../icons";
import { planDish } from "../../meal-week-actions";
import { setDishArchived } from "../actions";
import { RenameDishForm } from "../dish-forms";
import { DishTags } from "../dish-tags";
import { removeRecipe } from "./actions";
import { RecipeForm } from "./recipe-form";

export default async function DishPage({ params }: PageProps<"/dishes/[dishId]">) {
  const { dishId } = await params;
  const member = await requireMember();
  const app = application();
  const [dish, tags, currentMealWeek] = await Promise.all([
    app.getDish({ member, dishId }).catch((error) => {
      if (error instanceof DishNotFoundError) notFound();
      throw error;
    }),
    app.listTags({ member }),
    app.getCurrentMealWeek({ member }),
  ]);
  const { recipe } = dish;
  const steps = recipe?.steps.split("\n").filter((step) => step.trim()) ?? [];

  return (
    <AppShell current="dishes">
      <BackHeader href="/dishes" label="Back to Dishes" />

      <div className="flex flex-col gap-5 pb-4">
        <section className="flex flex-col gap-2.5 px-5">
          <h1 className="font-display text-[32px] leading-tight font-bold">{dish.name}</h1>
          {dish.archived && <p className="font-bold text-ink-soft">Archived</p>}
          <DishTags
            dishId={dish.id}
            dishName={dish.name}
            tags={dish.tags}
            tagNames={tags.map((tag) => tag.name)}
          />
        </section>

        {!dish.archived && (
          <div className="flex gap-2 px-4">
            <form action={planDish} className="flex flex-1">
              <input type="hidden" name="dishName" value={dish.name} />
              <input type="hidden" name="mealWeekStartDate" value={currentMealWeek.startDate} />
              <button type="submit" className="btn btn-pen flex-1 px-3">
                Add to this week
              </button>
            </form>
            <form action={planDish} className="flex flex-1">
              <input type="hidden" name="dishName" value={dish.name} />
              <input
                type="hidden"
                name="mealWeekStartDate"
                value={currentMealWeek.nextStartDate}
              />
              <button type="submit" className="btn btn-ghost flex-1 px-3">
                Next week
              </button>
            </form>
          </div>
        )}

        {recipe ? (
          <article aria-label="Recipe" className="flex flex-col gap-5">
            {recipe.ingredients && (
              <section className="card mx-4 overflow-hidden pt-3.5 pb-1.5">
                <h2 className="px-4 pb-1.5 font-display text-xl font-bold">
                  Ingredients
                </h2>
                <p className="ruled relative bg-[position:0_7px] pr-4 pb-2 pl-13 text-[17px] leading-8 whitespace-pre-line before:absolute before:inset-y-0 before:left-9 before:w-0.5 before:bg-marker/45">
                  {recipe.ingredients}
                </p>
              </section>
            )}
            {steps.length > 0 && (
              <section className="flex flex-col gap-3 px-5">
                <h2 className="font-display text-xl font-bold">
                  Steps
                </h2>
                <ol className="flex list-decimal flex-col gap-3.5 pl-6 text-[17px] leading-normal marker:font-hand marker:text-2xl marker:font-bold marker:text-pen">
                  {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </section>
            )}
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-5 inline-flex min-h-11 items-center gap-1.5 self-start font-bold text-pen underline underline-offset-2"
              >
                <ExternalIcon size={18} />
                Original recipe
              </a>
            )}
          </article>
        ) : (
          <p className="px-5 font-hand text-[26px] font-semibold text-ink-soft">No Recipe yet.</p>
        )}

        <details open={!recipe} className="card mx-4 px-4 py-1 open:pb-4">
          <summary className="flex min-h-12 cursor-pointer items-center font-bold text-pen">
            {recipe ? "Edit Recipe" : "Add Recipe"}
          </summary>
          <div className="mt-2">
            <RecipeForm dishId={dish.id} recipe={recipe} />
          </div>
        </details>

        <section className="mx-4 flex flex-col gap-3 border-t border-rule pt-4">
          <h2 className="label px-1">
            Name
          </h2>
          <RenameDishForm dishId={dish.id} name={dish.name} />
          <div className="flex flex-wrap justify-center gap-x-6">
            {recipe && (
              <form action={removeRecipe}>
                <input type="hidden" name="dishId" value={dish.id} />
                <button type="submit" className="btn px-2 font-bold text-danger">
                  Remove Recipe
                </button>
              </form>
            )}
            <form action={setDishArchived}>
              <input type="hidden" name="dishId" value={dish.id} />
              <input type="hidden" name="archived" value={String(!dish.archived)} />
              <button
                type="submit"
                aria-label={`${dish.archived ? "Unarchive" : "Archive"} ${dish.name}`}
                className="btn px-2 text-ink-soft"
              >
                {dish.archived ? "Unarchive this Dish" : "Archive this Dish"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
