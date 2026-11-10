import { ALL_CATEGORIES, type Category } from "@/lib/categories";

export const QUESTION_COUNTS = [10, 30, 50, 100] as const;
export const DEFAULT_QUESTION_COUNT = 10;

/** Seconds per question when the timer is enabled. */
export const TIMER_SECONDS = 15;
/** The bar turns red when this many seconds or fewer remain. */
export const TIMER_WARNING_SECONDS = 3;

export const AGE_MIN = 10;
export const AGE_MAX = 90;

export const GENDER_FILTERS = ["any", "male", "female"] as const;
export type GenderFilter = (typeof GENDER_FILTERS)[number];

export type QuizSettings = {
  count: number;
  timer: boolean;
  gender: GenderFilter;
  ageMin: number;
  ageMax: number;
  category: Category;
};

export const DEFAULT_SETTINGS: QuizSettings = {
  count: DEFAULT_QUESTION_COUNT,
  timer: true,
  gender: "any",
  ageMin: AGE_MIN,
  ageMax: AGE_MAX,
  category: ALL_CATEGORIES,
};

export type QuizReveal = {
  name: string;
  ethnicity: string;
  description?: string;
  occupation?: string;
  birthPlace?: string;
  wikipediaEnUrl?: string;
  commonsUrl: string;
};

export type QuizQuestion = {
  id: number;
  imageUrl: string;
  options: string[];
  /** Shipped with the question so the UI can give instant feedback. */
  correct: string;
  reveal: QuizReveal;
};

export type QuizAnswer = {
  questionId: number;
  selected: string | null;
  correct: boolean;
  timedOut: boolean;
  skipped: boolean;
};

export function isFullAgeRange(ageMin: number, ageMax: number): boolean {
  return ageMin === AGE_MIN && ageMax === AGE_MAX;
}

export function formatAgeRange(ageMin: number, ageMax: number): string {
  return `${ageMin}–${ageMax} years old`;
}
