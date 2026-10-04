import Link from "next/link";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { setDishArchived } from "./actions";
import { CreateDishForm, RenameDishForm } from "./dish-forms";
import { DishTags } from "./dish-tags";

export default async function DishCataloguePage({ searchParams }: PageProps<"/dishes">) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const archived = params.archived === "1";
  const tag = typeof params.tag === "string" && params.tag ? params.tag : undefined;
  const member = await requireMember();
  const [dishes, tags] = await Promise.all([
    application().listDishes({ member, search, archived, tag }),
    application().listTags({ member }),
  ]);
  const filterHref = (filterTag?: string) => {
    const query = new URLSearchParams();
    if (archived) query.set("archived", "1");
    if (search) query.set("search", search);
    if (filterTag) query.set("tag", filterTag);
    const encoded = query.toString();
    return encoded ? `/dishes?${encoded}` : "/dishes";
  };

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 text-sm">
        <Link href="/" className="underline">
          ← Current Meal Week
        </Link>
      </nav>
      <h1 className="mb-4 text-xl font-semibold">{archived ? "Archived Dishes" : "Dishes"}</h1>

      {!archived && (
        <div className="mb-4">
          <CreateDishForm />
        </div>
      )}

      <form role="search" className="mb-2 flex gap-2">
        {archived && <input type="hidden" name="archived" value="1" />}
        {tag && <input type="hidden" name="tag" value={tag} />}
        <label className="sr-only" htmlFor="search">
          Search Dishes
        </label>
        <input
          id="search"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search by name"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2"
        />
        <button type="submit" className="rounded border border-zinc-300 px-3 py-2">
          Search
        </button>
      </form>
      <p className="mb-4 flex gap-4 text-sm">
        <Link href={archived ? "/dishes" : "/dishes?archived=1"} className="underline">
          {archived ? "Show active Dishes" : "Show Archived Dishes"}
        </Link>
        <Link href="/tags" className="underline">
          Manage Tags
        </Link>
      </p>

      {(tags.length > 0 || tag) && (
        <nav aria-label="Filter by Tag" className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link
            href={filterHref()}
            aria-current={tag ? undefined : "page"}
            className="rounded-full border px-3 py-1 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white"
          >
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t.name}
              href={filterHref(t.name)}
              aria-current={tag?.toLowerCase() === t.name.toLowerCase() ? "page" : undefined}
              className="rounded-full border px-3 py-1 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white"
            >
              {t.name}
            </Link>
          ))}
        </nav>
      )}
      <datalist id="tag-names">
        {tags.map((t) => (
          <option key={t.name} value={t.name} />
        ))}
      </datalist>

      {dishes.length === 0 ? (
        <p className="text-zinc-500">No Dishes found.</p>
      ) : (
        <ul aria-label="Dishes" className="divide-y divide-zinc-200">
          {dishes.map((dish) => (
            <li key={dish.id} className="flex items-start gap-3 py-3">
              <div className="flex-1">
                <RenameDishForm dishId={dish.id} name={dish.name} />
                <DishTags dishId={dish.id} dishName={dish.name} tags={dish.tags} />
                <p className="px-2 text-sm text-zinc-500">
                  <Link
                    href={`/dishes/${dish.id}`}
                    aria-label={`${dish.hasRecipe ? "Recipe" : "Add Recipe"} for ${dish.name}`}
                    className={`mr-2 underline ${dish.hasRecipe ? "font-medium text-emerald-700" : ""}`}
                  >
                    {dish.hasRecipe ? "Recipe" : "Add Recipe"}
                  </Link>
                  {dish.lastPlannedIn
                    ? `Last planned in the Meal Week of ${formatDay(dish.lastPlannedIn)}`
                    : "Never planned"}
                </p>
              </div>
              <form action={setDishArchived}>
                <input type="hidden" name="dishId" value={dish.id} />
                <input type="hidden" name="archived" value={String(!dish.archived)} />
                <button
                  type="submit"
                  aria-label={`${dish.archived ? "Unarchive" : "Archive"} ${dish.name}`}
                  className="py-1 text-sm text-zinc-600 underline"
                >
                  {dish.archived ? "Unarchive" : "Archive"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
