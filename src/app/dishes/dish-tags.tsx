import { CloseIcon } from "../icons";
import { addDishTag, removeDishTag } from "./actions";

/** A Dish's Tags, each removable, and a field to add one (suggesting existing Tags). */
export function DishTags({
  dishId,
  dishName,
  tags,
  tagNames,
}: {
  dishId: string;
  dishName: string;
  tags: string[];
  /** Existing Tags, suggested while typing. */
  tagNames: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <form key={tag} action={removeDishTag}>
          <input type="hidden" name="dishId" value={dishId} />
          <input type="hidden" name="tag" value={tag} />
          <button
            type="submit"
            aria-label={`Remove Tag ${tag} from ${dishName}`}
            className="chip h-11 cursor-pointer gap-1.5 pr-2.5 pl-3.5 text-sm"
          >
            {tag}
            <CloseIcon size={14} />
          </button>
        </form>
      ))}
      <form action={addDishTag}>
        <input type="hidden" name="dishId" value={dishId} />
        <input
          name="tag"
          list="tag-names"
          required
          autoComplete="off"
          placeholder="+ Tag"
          aria-label={`Add a Tag to ${dishName}`}
          className="h-11 w-28 rounded-full border-[1.5px] border-dashed border-rule-strong bg-transparent px-3.5 text-sm placeholder:font-bold placeholder:text-ink-soft"
        />
        <button type="submit" className="sr-only">
          Add Tag to {dishName}
        </button>
      </form>
      <datalist id="tag-names">
        {tagNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
