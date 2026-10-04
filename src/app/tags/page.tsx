import Link from "next/link";
import { application } from "@/web/application";
import { requireMember } from "@/web/session";
import { deleteTag, renameTag } from "./actions";

export default async function TagsPage() {
  const member = await requireMember();
  const tags = await application().listTags({ member });

  return (
    <main className="mx-auto w-full max-w-xl p-4">
      <nav className="mb-6 text-sm">
        <Link href="/dishes" className="underline">
          ← Dishes
        </Link>
      </nav>
      <h1 className="mb-2 text-xl font-semibold">Tags</h1>
      <p className="mb-4 text-sm text-zinc-600">
        Renaming or deleting a Tag changes every Dish carrying it. Renaming onto an
        existing Tag merges the two.
      </p>
      {tags.length === 0 ? (
        <p className="text-zinc-500">No Tags yet. Add them to Dishes in the catalogue.</p>
      ) : (
        <ul aria-label="Tags" className="divide-y divide-zinc-200">
          {tags.map((tag) => (
            <li key={tag.name} className="flex items-center gap-3 py-3">
              <form action={renameTag} className="flex flex-1 gap-2">
                <input type="hidden" name="name" value={tag.name} />
                <input
                  key={tag.name}
                  name="newName"
                  required
                  defaultValue={tag.name}
                  aria-label={`Name of Tag ${tag.name}`}
                  className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1"
                />
                <button
                  type="submit"
                  aria-label={`Rename Tag ${tag.name}`}
                  className="text-sm underline"
                >
                  Rename
                </button>
              </form>
              <Link
                href={`/dishes?tag=${encodeURIComponent(tag.name)}`}
                className="text-sm text-zinc-600 underline"
              >
                {tag.dishCount} {tag.dishCount === 1 ? "Dish" : "Dishes"}
              </Link>
              <form action={deleteTag}>
                <input type="hidden" name="name" value={tag.name} />
                <button
                  type="submit"
                  aria-label={`Delete Tag ${tag.name}`}
                  className="text-sm text-red-700 underline"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
