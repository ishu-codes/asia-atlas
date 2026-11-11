import "server-only";

import fs from "node:fs";
import path from "node:path";
import { ALL_CATEGORIES, CATEGORIES, type Category } from "@/lib/categories";
import { isFullAgeRange } from "@/lib/quiz";

const DATA_FILE = path.join(process.cwd(), "data", "people.classified.json");

const COMMON_KEYS = new Set([
  "id",
  "name",
  "description",
  "occupation",
  "category",
  "imageUrl",
  "wikipediaEnUrl",
  "ethnicity",
  "nationalityQId",
  "gender",
  "givenName",
  "familyName",
  "birthDate",
  "dataSource",
  "schemaVersion",
  "createdAt",
]);

export type Person = {
  id: number;
  name: string;
  description: string | null;
  occupation: string | null;
  category: Exclude<Category, typeof ALL_CATEGORIES> | null;
  imageUrl: string;
  wikipediaEnUrl: string | null;
  ethnicity: string;
  nationalityQid: string | null;
  gender: "male" | "female" | "unknown";
  givenName: string | null;
  familyName: string | null;
  birthDate: string | null;
  dataSource: string;
  schemaVersion: string;
  createdAt: string;
  other: Record<string, unknown>;
};

export type PersonFilters = {
  gender: "any" | "male" | "female";
  ageMin: number;
  ageMax: number;
  category: string;
};

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return stringOrNull(value) ?? fallback;
}

function normalizeGender(value: unknown): Person["gender"] {
  return value === "male" || value === "female" ? value : "unknown";
}

function normalizeCategory(value: unknown): Person["category"] {
  if (
    typeof value === "string" &&
    value !== ALL_CATEGORIES &&
    CATEGORIES.includes(value as Category)
  ) {
    return value as Exclude<Category, typeof ALL_CATEGORIES>;
  }
  return null;
}

function normalizePerson(record: unknown, index: number): Person {
  if (typeof record !== "object" || record === null) {
    throw new Error(`Person at index ${index} is not an object.`);
  }

  const raw = record as Record<string, unknown>;
  if (!Number.isSafeInteger(raw.id) || (raw.id as number) <= 0) {
    throw new Error(`Person at index ${index} has an invalid id.`);
  }

  const name = stringOrNull(raw.name);
  const imageUrl = stringOrNull(raw.imageUrl);
  const ethnicity = stringOrNull(raw.ethnicity);

  if (!name || !imageUrl || !ethnicity) {
    throw new Error(`Person at index ${index} is missing required data.`);
  }

  return {
    id: raw.id as number,
    name,
    description: stringOrNull(raw.description),
    occupation: stringOrNull(raw.occupation),
    category: normalizeCategory(raw.category),
    imageUrl,
    wikipediaEnUrl: stringOrNull(raw.wikipediaEnUrl),
    ethnicity,
    nationalityQid: stringOrNull(raw.nationalityQId),
    gender: normalizeGender(raw.gender),
    givenName: stringOrNull(raw.givenName),
    familyName: stringOrNull(raw.familyName),
    birthDate: stringOrNull(raw.birthDate),
    dataSource: stringOrDefault(raw.dataSource, "wikidata"),
    schemaVersion: stringOrDefault(raw.schemaVersion, "1"),
    createdAt: stringOrDefault(raw.createdAt, ""),
    other: Object.fromEntries(
      Object.entries(raw).filter(([key]) => !COMMON_KEYS.has(key)),
    ),
  };
}

function loadPeople(): Person[] {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("data/people.classified.json must contain an array.");
  }

  const byId = new Map<number, Person>();
  parsed.forEach((record, index) => {
    const person = normalizePerson(record, index);
    // The source contains one repeated Wikidata id. Keep the last record so
    // question ids remain unique, matching the previous seed behavior.
    byId.set(person.id, person);
  });

  return [...byId.values()];
}

const PEOPLE = loadPeople();
const ETHNICITIES = [...new Set(PEOPLE.map((person) => person.ethnicity))].sort(
  (a, b) => a.localeCompare(b),
);
const CATEGORY_COUNT = new Set(
  PEOPLE.flatMap((person) => (person.category ? [person.category] : [])),
).size;

function yearsAgoIso(today: Date, years: number): string {
  const date = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

export function getAllPeople(): readonly Person[] {
  return PEOPLE;
}

export function getAllEthnicities(): readonly string[] {
  return ETHNICITIES;
}

export function getCategoryCount(): number {
  return CATEGORY_COUNT;
}

export function filterPeople(filters: PersonFilters): Person[] {
  const fullAgeRange = isFullAgeRange(filters.ageMin, filters.ageMax);
  const today = new Date();
  const earliestBirthDate = yearsAgoIso(today, filters.ageMax + 1);
  const latestBirthDate = yearsAgoIso(today, filters.ageMin);

  return PEOPLE.filter((person) => {
    if (filters.gender !== "any" && person.gender !== filters.gender) {
      return false;
    }

    if (
      filters.category !== ALL_CATEGORIES &&
      person.category !== filters.category
    ) {
      return false;
    }

    if (fullAgeRange) return true;
    if (!person.birthDate) return false;

    const birthDate = person.birthDate.slice(0, 10);
    return birthDate > earliestBirthDate && birthDate <= latestBirthDate;
  });
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}
