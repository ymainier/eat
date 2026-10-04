export type Recipe = {
  ingredients: string;
  steps: string;
  sourceUrl: string | null;
};

export class InvalidSourceUrlError extends Error {
  constructor(url: string) {
    super(`"${url}" is not a web address`);
  }
}

export class EmptyRecipeError extends Error {
  constructor() {
    super("A Recipe needs ingredients, steps or a source URL");
  }
}

/** A Recipe as entered: free text kept as typed, the source URL optional but a web address. */
export function recipe(input: { ingredients: string; steps: string; sourceUrl?: string | null }): Recipe {
  const sourceUrl = input.sourceUrl?.trim() || null;
  if (sourceUrl) {
    let url: URL | null = null;
    try {
      url = new URL(sourceUrl);
    } catch {}
    if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
      throw new InvalidSourceUrlError(sourceUrl);
    }
  }
  const ingredients = input.ingredients.trim();
  const steps = input.steps.trim();
  if (!ingredients && !steps && !sourceUrl) throw new EmptyRecipeError();
  return { ingredients, steps, sourceUrl };
}
