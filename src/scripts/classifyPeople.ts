import fs from "node:fs";
import path from "node:path";
import { ALL_CATEGORIES, CATEGORIES, type Category } from "../lib/categories";
import { type ChoiceQuestion, classifier } from "../lib/classifier";

/**
 * Builds data/people.classified.json by asking the classifier for one
 * occupational category per unique description/occupation pair.
 *
 * Requests are batched: one request can carry several numbered people and one
 * choice question per person. The upstream demo endpoint is capacity-limited,
 * so batching is what makes a full run practical. A failed batch is split in
 * half and retried, down to a single person.
 *
 * Usage:
 *   pnpm classify:people
 *   pnpm classify:people --refresh
 *   pnpm classify:people --workers 4 --batch-size 10
 *   pnpm classify:people --limit 25
 *
 * By default, existing non-null categories are preserved and only null
 * categories are classified. `--refresh` reclassifies every person. The app
 * never calls the classifier. prisma/seed.ts imports the JSON this script
 * writes, keeping seeding fast and deterministic. Wikidata ids are stored as
 * integers and MongoDB `_id` values are removed from the output.
 */

const ROOT = process.cwd();
const SOURCE =
  [
    path.join(ROOT, "data", "people.json"),
    path.join(ROOT, "src", "scripts", "people.json"),
  ].find((file) => fs.existsSync(file)) ??
  path.join(ROOT, "src", "scripts", "people.json");
const OUTPUT = path.join(ROOT, "data", "people.classified.json");
const CACHE = path.join(ROOT, "data", "category-cache.json");
const CACHE_VERSION = 1;

type PersonCategory = Exclude<Category, typeof ALL_CATEGORIES>;

const PERSON_CATEGORIES = CATEGORIES.filter(
  (category): category is Exclude<Category, typeof ALL_CATEGORIES> =>
    category !== ALL_CATEGORIES,
);

const CATEGORY_HINTS: Record<string, string> = {
  "Arts & Entertainment":
    "Actors, musicians, writers, visual artists, and other performers.",
  "Business & Finance":
    "Businesspeople, entrepreneurs, executives, economists, and financiers.",
  "Creative & Design":
    "Designers, architects, photographers, and fashion professionals.",
  "Digital Content":
    "Influencers, YouTubers, streamers, bloggers, and social media personalities.",
  Education:
    "Teachers, professors, school administrators, and education researchers.",
  "Entertainment Industry":
    "Producers, directors, agents, and studio or entertainment executives.",
  "Government & Politics":
    "Politicians, government officials, diplomats, and public-office activists.",
  Legal: "Lawyers, judges, and legal scholars.",
  "Media & Journalism": "Journalists, news anchors, editors, and broadcasters.",
  "Medical & Healthcare":
    "Physicians, nurses, surgeons, and public health workers.",
  "Military & Defense": "Military officers, soldiers, and defense officials.",
  "Religious & Spiritual":
    "Clergy, monks, religious scholars, and spiritual leaders.",
  "Science & Research":
    "Scientists, researchers, and academics in STEM fields.",
  Sports: "Athletes and competitors.",
  "Sports Management & Coaching":
    "Coaches, managers, referees, and sports administrators.",
  Technology: "Engineers, programmers, technologists, and inventors.",
  "Traditional Arts & Culture":
    "Craftspeople, folk artists, calligraphers, and traditional performers.",
};

const CATEGORY_GUIDE = [
  "CATEGORY GUIDE",
  ...PERSON_CATEGORIES.map(
    (category) => `- ${category}: ${CATEGORY_HINTS[category]}`,
  ),
].join("\n");

const CATEGORY_CRITERIA = PERSON_CATEGORIES.reduce<
  Record<PersonCategory, null>
>(
  (criteria, category) => {
    criteria[category] = null;
    return criteria;
  },
  {} as Record<PersonCategory, null>,
);

type SourcePerson = Record<string, unknown>;
type CachedResult = {
  category: string | null;
  choice: string;
  confidence: number;
};
type CacheFile = {
  version: number;
  results: Record<string, CachedResult>;
};
type Pair = {
  description: string;
  occupation: string;
};
type PairEntry = [string, Pair];
type Batch = PairEntry[];

function pairKey(description: string, occupation: string): string {
  return JSON.stringify([description, occupation]);
}

function isPersonCategory(value: unknown): value is PersonCategory {
  return (
    typeof value === "string" &&
    PERSON_CATEGORIES.includes(value as PersonCategory)
  );
}

function recordCategory(person: SourcePerson): PersonCategory | null {
  return isPersonCategory(person.category) ? person.category : null;
}

function wikidataIdToInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string") return null;

  const match = /^Q?(\d+)$/.exec(value.trim());
  const id = match ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function personKey(person: SourcePerson): string {
  const id = wikidataIdToInt(person.id);
  return id === null ? String(person.id) : String(id);
}

function withoutMongoId(person: SourcePerson): SourcePerson {
  return Object.fromEntries(
    Object.entries(person).filter(([key]) => key !== "_id"),
  );
}

function loadExisting(): SourcePerson[] {
  if (!fs.existsSync(OUTPUT)) return [];

  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
    return Array.isArray(parsed) ? (parsed as SourcePerson[]) : [];
  } catch {
    return [];
  }
}

function loadCache(refresh: boolean): Record<string, CachedResult> {
  if (refresh || !fs.existsSync(CACHE)) return {};

  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(CACHE, "utf8"));
    if (typeof parsed !== "object" || parsed === null) return {};
    const file = parsed as Partial<CacheFile>;
    if (file.version !== CACHE_VERSION) return {};
    return file.results && typeof file.results === "object" ? file.results : {};
  } catch {
    return {};
  }
}

function saveCache(results: Record<string, CachedResult>): void {
  const file: CacheFile = { version: CACHE_VERSION, results };
  const temp = `${CACHE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(file, null, 2), "utf8");
  fs.renameSync(temp, CACHE);
}

async function runPool<T>(
  items: readonly T[],
  workers: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      await task(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, workers), items.length) },
      worker,
    ),
  );
}

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readNumberArg(flag: string, fallback: number): number {
  const raw = readArg(flag);
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function stateForBatch(batch: Batch): string {
  const people = batch
    .map(
      ([, pair], index) =>
        `Person ${index + 1}\nDescription: ${pair.description || "unknown"}\nOccupation: ${
          pair.occupation || "unknown"
        }`,
    )
    .join("\n\n");

  return `${CATEGORY_GUIDE}\n\nPEOPLE\n${people}`;
}

function questionsForBatch(batch: Batch): ChoiceQuestion[] {
  return batch.map((_, index) => ({
    type: "choice",
    name: `person_${index + 1}`,
    instructions: `Classify only Person ${index + 1} from the numbered list, using the category guide in the state. Choose the single best-fitting category. A category is required even when the description or occupation is sparse.`,
    criteria: CATEGORY_CRITERIA,
  }));
}

function resultFromAnswer(choice: string, confidence: number): CachedResult {
  if (!isPersonCategory(choice)) {
    throw new Error(`Unexpected category from classifier: ${choice}`);
  }

  return { category: choice, choice, confidence };
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing ${SOURCE}.`);
  }

  const parsed: unknown = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${SOURCE} must contain a JSON array.`);
  }

  const people = parsed as SourcePerson[];
  const refresh = process.argv.includes("--refresh");
  const existingById = new Map(
    (refresh ? [] : loadExisting()).map((person) => [
      personKey(person),
      person,
    ]),
  );
  const pairs = new Map<string, Pair>();

  for (const person of people) {
    const existing = existingById.get(personKey(person));
    if (existing && recordCategory(existing)) continue;

    const description =
      typeof person.description === "string" ? person.description.trim() : "";
    const occupation =
      typeof person.occupation === "string" ? person.occupation.trim() : "";
    pairs.set(pairKey(description, occupation), { description, occupation });
  }

  const workers = readNumberArg("--workers", 4);
  const batchSize = readNumberArg("--batch-size", 10);
  const limit = readNumberArg("--limit", 0);
  const cache = loadCache(refresh);

  let pending = [...pairs.entries()].filter(([key]) => {
    return !isPersonCategory(cache[key]?.category);
  });
  if (limit > 0) pending = pending.slice(0, limit);

  const batches: Batch[] = [];
  for (let index = 0; index < pending.length; index += batchSize) {
    batches.push(pending.slice(index, index + batchSize));
  }

  console.log(
    `${people.length} people, ${pairs.size} unique description/occupation pairs still need a category`,
  );
  console.log(
    `${Object.keys(cache).length} cached, ${pending.length} to classify in ${batches.length} batches (${workers} workers, up to ${batchSize} people per request)`,
  );

  let completed = 0;
  let failures = 0;

  async function classifyBatch(batch: Batch): Promise<void> {
    try {
      const answers = await classifier.classify(
        stateForBatch(batch),
        questionsForBatch(batch),
      );

      const results = batch.map(([, pair], index): CachedResult => {
        const answer = answers[`person_${index + 1}`];
        if (!answer || answer.type !== "choice") {
          throw new Error(
            `Missing choice answer for person ${index + 1} (${pair.description} / ${pair.occupation}).`,
          );
        }
        return resultFromAnswer(answer.choice, answer.confidence);
      });

      for (let index = 0; index < batch.length; index += 1) {
        cache[batch[index][0]] = results[index];
      }

      completed += batch.length;
      if (completed % 25 < batch.length) saveCache(cache);
      console.log(
        `classified ${completed}/${pending.length} pairs (${failures} failures)`,
      );
    } catch (error) {
      if (batch.length === 1) {
        failures += 1;
        const [, pair] = batch[0];
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `FAILED ${JSON.stringify(pair.description)} / ${JSON.stringify(
            pair.occupation,
          )}: ${message}`,
        );
        return;
      }

      const middle = Math.ceil(batch.length / 2);
      await classifyBatch(batch.slice(0, middle));
      await classifyBatch(batch.slice(middle));
    }
  }

  await runPool(batches, workers, classifyBatch);
  saveCache(cache);

  const counts = new Map<string, number>();
  const classified = people.map((person) => {
    const existing = existingById.get(personKey(person));
    const id = wikidataIdToInt(person.id);
    if (id === null) {
      throw new Error(`Invalid Wikidata id: ${String(person.id)}`);
    }
    const description =
      typeof person.description === "string" ? person.description.trim() : "";
    const occupation =
      typeof person.occupation === "string" ? person.occupation.trim() : "";
    const cachedCategory = cache[pairKey(description, occupation)]?.category;
    const category =
      (existing ? recordCategory(existing) : null) ??
      (isPersonCategory(cachedCategory) ? cachedCategory : null);
    const label = category ?? "NULL";
    counts.set(label, (counts.get(label) ?? 0) + 1);
    return { ...withoutMongoId(person), id, category };
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(classified, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT} (${classified.length} records)`);

  for (const [category, count] of [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )) {
    console.log(`  ${category}: ${count}`);
  }

  if (failures > 0) {
    throw new Error(
      `${failures} pair(s) failed. Re-run to retry; cached results are kept.`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
