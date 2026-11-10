export const ALL_CATEGORIES = "All Categories" as const;

export const CATEGORIES = [
  ALL_CATEGORIES,
  "Arts & Entertainment",
  "Business & Finance",
  "Creative & Design",
  "Digital Content",
  "Education",
  "Entertainment Industry",
  "Government & Politics",
  "Legal",
  "Media & Journalism",
  "Medical & Healthcare",
  "Military & Defense",
  "Religious & Spiritual",
  "Science & Research",
  "Sports",
  "Sports Management & Coaching",
  "Technology",
  "Traditional Arts & Culture",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Filled in by a later occupation-mapping step. Keys are occupations as they
 * appear in the database; values must be one of the non-"All Categories" values
 * above.
 */
export const OCCUPATION_TO_CATEGORY: Record<
  string,
  Exclude<Category, typeof ALL_CATEGORIES>
> = {};
