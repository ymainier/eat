import Link from "next/link";
import { notFound } from "next/navigation";
import { DishNotFoundError } from "@/application";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import { removeRecipe } from "./actions";
import { RecipeForm } from "./recipe-form";

export default async function DishPage({ params }: PageProps<"/dishes/[dishId]">) {
  const { dishId } = await params;
  const member = await requireMember();
  const dish = await application()
    .getDish({ member, dishId })
    .catch((error) => {
      if (error instanceof DishNotFoundError) notFound();
      throw error;
    });
  const { recipe } = dish;

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 flex gap-4 text-sm">
        <Link href="/" className="underline">
          ← Current Meal Week
        </Link>
        <Link href="/dishes" className="underline">
          Dishes
        </Link>
      </nav>
      <h1 className="text-xl font-semibold">{dish.name}</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {[dish.archived && "Archived", ...dish.tags].filter(Boolean).join(" · ")}
      </p>

      {recipe ? (
        <article aria-label="Recipe" className="mb-8 flex flex-col gap-4">
          <section>
            <h2 className="font-semibold">Ingredients</h2>
            <p className="whitespace-pre-line">{recipe.ingredients || "—"}</p>
          </section>
          <section>
            <h2 className="font-semibold">Steps</h2>
            <p className="whitespace-pre-line">{recipe.steps || "—"}</p>
          </section>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Original recipe
            </a>
          )}
        </article>
      ) : (
        <p className="mb-8 text-zinc-500">No Recipe yet.</p>
      )}

      <details open={!recipe} className="mb-4">
        <summary className="cursor-pointer font-semibold">
          {recipe ? "Edit Recipe" : "Add Recipe"}
        </summary>
        <div className="mt-4">
          <RecipeForm dishId={dish.id} recipe={recipe} />
        </div>
      </details>
      {recipe && (
        <form action={removeRecipe}>
          <input type="hidden" name="dishId" value={dish.id} />
          <button type="submit" className="text-sm text-red-700 underline">
            Remove Recipe
          </button>
        </form>
      )}
    </main>
  );
}
