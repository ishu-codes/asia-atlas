/**
 * `other` is JSON text in SQLite because the column holds a loose set of
 * attributes that change as the Wikidata export changes. Bad or missing JSON
 * is treated as an empty object so a single bad row can never break a screen.
 */
export function parseOther(person: {
  other: string | null;
}): Record<string, unknown> {
  if (!person.other) return {};

  try {
    const parsed: unknown = JSON.parse(person.other);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getString(
  other: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = other[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
