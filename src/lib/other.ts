export function getString(
  other: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = other[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
