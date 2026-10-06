import Link from "next/link";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import { AppShell, BackHeader } from "../app-shell";
import { deleteTag, renameTag } from "./actions";

export default async function TagsPage() {
  const member = await requireMember();
  const tags = await application().listTags({ member });

  return (
    <AppShell current="dishes">
      <BackHeader href="/dishes" label="Back to Dishes">
        <h1 className="flex-1 pl-1 font-display text-[26px] font-bold">Tags</h1>
      </BackHeader>
      <div className="flex flex-col gap-3 px-4 pt-2">
        <p className="px-1 text-[15px] leading-relaxed text-ink-soft">
          Renaming or deleting a Tag changes every Dish carrying it. Renaming onto an existing Tag
          merges the two.
        </p>
        {tags.length === 0 ? (
          <p className="py-8 text-center font-hand text-[28px] font-semibold text-ink-soft">
            No Tags yet. Add them to Dishes in the catalogue.
          </p>
        ) : (
          <ul aria-label="Tags" className="card divide-y divide-rule">
            {tags.map((tag) => (
              <li key={tag.name} className="flex flex-col gap-1 px-3 py-3">
                <form action={renameTag} className="flex gap-2">
                  <input type="hidden" name="name" value={tag.name} />
                  <input
                    key={tag.name}
                    name="newName"
                    required
                    defaultValue={tag.name}
                    aria-label={`Name of Tag ${tag.name}`}
                    className="field flex-1"
                  />
                  <button
                    type="submit"
                    aria-label={`Rename Tag ${tag.name}`}
                    className="btn btn-ghost px-4"
                  >
                    Rename
                  </button>
                </form>
                <div className="flex items-center justify-between px-1">
                  <Link
                    href={`/dishes?tag=${encodeURIComponent(tag.name)}`}
                    className="flex min-h-11 items-center text-[15px] font-medium text-pen underline underline-offset-2"
                  >
                    {tag.dishCount} {tag.dishCount === 1 ? "Dish" : "Dishes"}
                  </Link>
                  <form action={deleteTag}>
                    <input type="hidden" name="name" value={tag.name} />
                    <button
                      type="submit"
                      aria-label={`Delete Tag ${tag.name}`}
                      className="flex min-h-11 cursor-pointer items-center px-2 text-[15px] font-bold text-danger"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
