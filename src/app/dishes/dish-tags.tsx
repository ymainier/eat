import { addDishTag, removeDishTag } from "./actions";

/** A Dish's Tags, each removable, and a field to add one (suggesting existing Tags). */
export function DishTags({
  dishId,
  dishName,
  tags,
}: {
  dishId: string;
  dishName: string;
  tags: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-2">
      {tags.map((tag) => (
        <form key={tag} action={removeDishTag}>
          <input type="hidden" name="dishId" value={dishId} />
          <input type="hidden" name="tag" value={tag} />
          <button
            type="submit"
            aria-label={`Remove Tag ${tag} from ${dishName}`}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
          >
            {tag} ×
          </button>
        </form>
      ))}
      <form action={addDishTag} className="flex items-center gap-1">
        <input type="hidden" name="dishId" value={dishId} />
        <input
          name="tag"
          list="tag-names"
          required
          autoComplete="off"
          placeholder="Add a Tag"
          aria-label={`Add a Tag to ${dishName}`}
          className="w-24 rounded border border-zinc-200 px-2 py-0.5 text-xs"
        />
        <button type="submit" className="sr-only">
          Add Tag to {dishName}
        </button>
      </form>
    </div>
  );
}
