import Link from "next/link";
import { application } from "@/web/application";
import { formatDay } from "@/web/format";
import { requireMember } from "@/web/session";
import { AppShell } from "../app-shell";
import { BookIcon, ChevronRightIcon, SearchIcon } from "../icons";
import { CreateDishForm } from "./dish-forms";

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
    <AppShell current="dishes">
      <header className="px-5 pt-4.5 pb-2">
        <h1 className="font-display text-[30px] leading-tight font-bold">
          {archived ? "Archived Dishes" : "Dishes"}
        </h1>
      </header>

      <div className="flex flex-col gap-3 px-4">
        {!archived && <CreateDishForm />}

        <form role="search" className="relative">
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
            placeholder="Search Dishes"
            className="field pr-13"
          />
          <button
            type="submit"
            aria-label="Search"
            className="icon-btn absolute top-0.5 right-0.5 text-ink-soft"
          >
            <SearchIcon size={22} />
          </button>
        </form>
      </div>

      {(tags.length > 0 || tag) && (
        <nav
          aria-label="Filter by Tag"
          className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 [scrollbar-width:none]"
        >
          <Link href={filterHref()} aria-current={tag ? undefined : "page"} className="chip-filter">
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t.name}
              href={filterHref(t.name)}
              aria-current={tag?.toLowerCase() === t.name.toLowerCase() ? "page" : undefined}
              className="chip-filter"
            >
              {t.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-2 px-4 pt-3">
        {dishes.length === 0 ? (
          <p className="py-8 text-center font-hand text-[28px] font-semibold text-ink-soft">
            No Dishes found.
          </p>
        ) : (
          <ul aria-label="Dishes" className="card divide-y divide-rule overflow-hidden">
            {dishes.map((dish) => (
              <li key={dish.id}>
                <Link
                  href={`/dishes/${dish.id}`}
                  className="flex min-h-16 items-center gap-2.5 py-2 pr-2 pl-4"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-lg font-medium">{dish.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {dish.tags.map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                      {dish.hasRecipe && (
                        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-soft">
                          <BookIcon size={15} />
                          Recipe
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] text-ink-soft">
                      {dish.lastPlannedIn
                        ? `Last planned in the Meal Week of ${formatDay(dish.lastPlannedIn)}`
                        : "Never planned"}
                    </span>
                  </span>
                  <ChevronRightIcon className="shrink-0 text-ink-soft" size={22} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="flex justify-center gap-6 text-[15px] font-bold text-ink-soft">
          <Link href={archived ? "/dishes" : "/dishes?archived=1"} className="flex min-h-13 items-center">
            {archived ? "Show active Dishes" : "Show Archived Dishes"}
          </Link>
          <Link href="/tags" className="flex min-h-13 items-center">
            Manage Tags
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
