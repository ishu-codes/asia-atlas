import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  type Category,
} from "../src/lib/categories";

const CLASSIFIED_FILE = path.join(
  process.cwd(),
  "data",
  "people.classified.json",
);
const SOURCE_FILE =
  [
    path.join(process.cwd(), "data", "people.json"),
    path.join(process.cwd(), "src", "scripts", "people.json"),
  ].find((file) => fs.existsSync(file)) ??
  path.join(process.cwd(), "src", "scripts", "people.json");
const DATA_FILE = fs.existsSync(CLASSIFIED_FILE)
  ? CLASSIFIED_FILE
  : SOURCE_FILE;

const COMMON_KEYS = new Set([
  "_id",
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

type SourceRecord = Record<string, unknown>;

const orNull = (value: unknown): string | null => {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value;
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

function wikidataIdToInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string") return null;
  const match = /^Q?(\d+)$/.exec(value.trim());
  return match ? Number.parseInt(match[1], 10) : null;
}

function normalizeGender(value: unknown): "male" | "female" | "unknown" {
  return value === "male" || value === "female" ? value : "unknown";
}

function normalizeCategory(value: unknown): string | null {
  if (
    typeof value === "string" &&
    value !== ALL_CATEGORIES &&
    CATEGORIES.includes(value as Category)
  ) {
    return value;
  }
  return null;
}

function personFromRecord(record: SourceRecord) {
  const id = wikidataIdToInt(record.id);
  if (id === null) {
    throw new Error(`Invalid Wikidata id: ${String(record.id)}`);
  }

  const other = Object.fromEntries(
    Object.entries(record).filter(([key]) => !COMMON_KEYS.has(key)),
  );

  return {
    id,
    name: asString(record.name),
    description: orNull(record.description),
    occupation: orNull(record.occupation),
    category: normalizeCategory(record.category),
    imageUrl: asString(record.imageUrl),
    wikipediaEnUrl: orNull(record.wikipediaEnUrl),
    ethnicity: asString(record.ethnicity),
    nationalityQid: orNull(record.nationalityQId),
    gender: normalizeGender(record.gender),
    givenName: orNull(record.givenName),
    familyName: orNull(record.familyName),
    birthDate: orNull(record.birthDate),
    dataSource: asString(record.dataSource) || "wikidata",
    schemaVersion: asString(record.schemaVersion) || "1",
    createdAt: asString(record.createdAt),
    other: JSON.stringify(other),
  };
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `Missing seed file at ${DATA_FILE}. Add data/people.json and run the seed again.`,
    );
  }

  console.log(`Seeding from ${path.relative(process.cwd(), DATA_FILE)}`);

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(
      "data/people.json must contain an array of person records.",
    );
  }

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const records = parsed.map((item, index) => {
      if (typeof item !== "object" || item === null) {
        throw new Error(`Record at index ${index} is not an object.`);
      }
      return personFromRecord(item as SourceRecord);
    });

    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await prisma.$transaction(
        chunk.map((person) =>
          prisma.person.upsert({
            where: { id: person.id },
            create: person,
            update: person,
          }),
        ),
      );
      process.stdout.write(
        `Seeded ${Math.min(i + chunkSize, records.length)} / ${records.length}\r`,
      );
    }

    const total = await prisma.person.count();
    process.stdout.write(
      `\nSeeded ${records.length} records. people table now has ${total} rows.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
