# Asia Atlas

A mobile-first quiz about ethnicity labels in a Wikidata-derived people dataset. Each round shows a real person's photo, four ethnicity options, and a 15-second timer. Answering reveals who the person is: name, description, occupation, birthplace, Wikipedia link, and the Commons photo source.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict
- tRPC 11, Zod, TanStack Query
- No database. The server reads `data/people.classified.json` into memory.
- shadcn/ui (Base UI), Tailwind CSS 4
- `flag-icons` for country flags

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app needs no environment variables or database setup.

## Data

| Path | Purpose |
| --- | --- |
| `src/scripts/people.json` | Source export (4,000 records). Committed. |
| `data/people.json` | Optional local copy of the source export. Gitignored. |
| `data/people.classified.json` | Server data source. Contains integer ids, categories, and no `_id`. |
| `data/category-cache.json` | Classifier cache. Gitignored. |

The classifier export converts Wikidata ids such as `Q1234` to the integer `1234`. Missing or invalid gender becomes `unknown`. The server reads the complete file once per process and filters it in memory.

For Vercel, `next.config.ts` adds the JSON file to the server trace for `/api/trpc/[trpc]`. No database or external storage is required.

### Categories

`category` is one of the 17 person categories in `src/lib/categories.ts`. The current export has no null categories. The app never infers ethnicity from a photo; every label comes from the source records.

### Classifying people

```bash
pnpm classify:people
```

The script groups unique description/occupation pairs into batches and asks the remote classifier for one category per person. By default, it preserves existing categories and classifies only records with a null category. `--refresh` reclassifies every record. It writes integer ids, removes `_id`, caches each answer, and updates `data/people.classified.json`. Re-run after a failure to retry only missing pairs.

Options:

```bash
pnpm classify:people --workers 4 --batch-size 10
pnpm classify:people --limit 25
pnpm classify:people --refresh
```

The classifier endpoint is capacity-limited. Batches are split automatically when a request fails, so progress is kept even if the upstream service returns 429s.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server. |
| `pnpm build` | Production build. |
| `pnpm start` | Run the production build. |
| `pnpm typecheck` | TypeScript, no emit. |
| `pnpm lint` | Biome check. |
| `pnpm classify:people` | Fill missing categories and rewrite `data/people.classified.json`. |

## Notes

- Photos are hotlinked from Wikimedia Commons through `Special:FilePath`. A failed photo is skipped client-side.
- The timer starts only after the current photo decodes.
- The reveal uses a bottom drawer on phones and a card on wider screens.
- Ethnicity labels are source data, not predictions. This is a casual quiz, not a scientific tool.
- Not affiliated with Wikimedia.
