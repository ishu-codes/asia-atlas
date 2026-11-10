import type { Prisma } from "@/generated/prisma/client";
import { isFullAgeRange } from "@/lib/quiz";

export type PersonFilters = {
  gender: "any" | "male" | "female";
  ageMin: number;
  ageMax: number;
  category: string;
};

/** ISO date (YYYY-MM-DD) for the given number of years before `today`. */
function yearsAgoIso(today: Date, years: number): string {
  const date = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

/**
 * Current age is between ageMin and ageMax (inclusive):
 *   birthDate <= today - ageMin years
 *   birthDate >  today - (ageMax + 1) years
 * Stored birth dates are ISO 8601 strings, so string comparison is valid.
 */
export function buildPersonWhere(
  filters: PersonFilters,
): Prisma.PersonWhereInput {
  const where: Prisma.PersonWhereInput = {};

  if (filters.gender !== "any") {
    where.gender = filters.gender;
  }

  if (filters.category !== "All Categories") {
    where.category = filters.category;
  }

  const today = new Date();
  const birthDate: Prisma.StringNullableFilter = {
    gt: yearsAgoIso(today, filters.ageMax + 1),
    lte: yearsAgoIso(today, filters.ageMin),
  };

  if (!isFullAgeRange(filters.ageMin, filters.ageMax)) {
    birthDate.not = null;
  }

  where.birthDate = birthDate;

  return where;
}
