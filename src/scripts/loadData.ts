import fs from "node:fs";
import Database from "better-sqlite3";

/**
 * Raw-SQL fallback for loading the export without Prisma. The supported path is
 * `pnpm prisma db seed` (prisma/seed.ts); keep this in sync if the table changes.
 */
const db = new Database("./prisma/dev.db");

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

const insert = db.prepare(`
  INSERT OR REPLACE INTO people (
    id, name, description, occupation, category,
    image_url, wikipedia_en_url, ethnicity, nationality_qid, gender,
    given_name, family_name, birth_date, data_source, schema_version,
    created_at, other
  ) VALUES (
    @id, @name, @description, @occupation, @category,
    @image_url, @wikipedia_en_url, @ethnicity, @nationality_qid, @gender,
    @given_name, @family_name, @birth_date, @data_source, @schema_version,
    @created_at, @other
  )
`);

const orNull = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value;
};

const normalizeGender = (value: unknown) =>
  value === "male" || value === "female" ? value : "unknown";

const classifiedFile = "./data/people.classified.json";
const sourcePeopleFile = fs.existsSync("./data/people.json")
  ? "./data/people.json"
  : "./src/scripts/people.json";
const sourceFile = fs.existsSync(classifiedFile)
  ? classifiedFile
  : sourcePeopleFile;

const records: Record<string, unknown>[] = JSON.parse(
  fs.readFileSync(sourceFile, "utf8"),
);

const run = db.transaction((rows: Record<string, unknown>[]) => {
  for (const record of rows) {
    const other = Object.fromEntries(
      Object.entries(record).filter(([key]) => !COMMON_KEYS.has(key)),
    );

    insert.run({
      id: Number.parseInt(String(record.id).replace(/^Q/, ""), 10),
      name: record.name,
      description: orNull(record.description),
      occupation: orNull(record.occupation),
      category: orNull(record.category), // set by src/scripts/classifyPeople.ts
      image_url: record.imageUrl,
      wikipedia_en_url: orNull(record.wikipediaEnUrl),
      ethnicity: record.ethnicity,
      nationality_qid: orNull(record.nationalityQId),
      gender: normalizeGender(record.gender),
      given_name: orNull(record.givenName),
      family_name: orNull(record.familyName),
      birth_date: orNull(record.birthDate),
      data_source: record.dataSource ?? "wikidata",
      schema_version: record.schemaVersion ?? "1",
      created_at: record.createdAt,
      other: JSON.stringify(other),
    });
  }
});

run(records);
