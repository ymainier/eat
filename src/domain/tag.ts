const normalise = (raw: string) => raw.trim().replace(/\s+/g, " ");

/** Tag names as typed: trimmed, blanks dropped, repeats (ignoring case) removed. */
export function tagNames(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const name of raw.map(normalise)) {
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names;
}

export class TagNameRequiredError extends Error {
  constructor() {
    super("A Tag needs a name");
  }
}

export function tagName(raw: string): string {
  const name = normalise(raw);
  if (!name) throw new TagNameRequiredError();
  return name;
}
