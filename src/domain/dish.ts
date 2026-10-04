export class DishNameRequiredError extends Error {
  constructor() {
    super("A Dish needs a name");
  }
}

/** Dish names are compared ignoring case and surrounding spaces. */
export function dishName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) throw new DishNameRequiredError();
  return name;
}
