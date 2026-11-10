# Build a mobile-first "guess the ethnicity" quiz web app

## Goal

Build a quiz where the app shows a photo of a real person and the user picks that person's ethnicity from four options. After each answer, the app reveals who the person is. The app is used mostly on phones, so design for a 360 to 430 px wide screen first and scale up from there, make it responsive (but mobile-first).

The answer key comes from Wikidata-sourced records that I have already collected (@src/scripts/people.json). The app never infers ethnicity from a face. The reveal card after every answer is a core feature, because it turns the app into something people learn from. The json data has id in string like "Q1234", here just remove the "Q" and store the id as 1234 in integer, in the db (you need to modify @src/scripts/loadData.json).

## Tech stack

- Next.js (current stable, App Router) with TypeScript in strict mode
- tRPC (current stable v11) with zod validation and the TanStack Query integration
- Prisma ORM with SQLite. Use the current stable Prisma release and follow its docs for SQLite client setup, including a driver adapter if that release requires one.
- Tailwind CSS and shadcn/ui. Use shadcn components wherever one exists and restyle them to fit the app. Write a custom component only when no shadcn component fits.
- `flag-icons` for country flags (CSS classes like `fi fi-kr`). Do not use emoji flags, because they do not render on Windows.
- No other UI libraries. Do not add framer-motion yet.

## Data model

Prisma is the source of truth for the schema. Create the table with a Prisma migration. Use this model:

```prisma
model Person {
  id     Int  @id @map("id")
  name           String
  description    String?
  occupation     String?
  category       String?
  imageUrl       String  @map("image_url")
  wikipediaEnUrl String? @map("wikipedia_en_url")
  ethnicity      String
  nationalityQid String? @map("nationality_qid")
  gender         String
  givenName      String? @map("given_name")
  familyName     String? @map("family_name")
  birthDate      String? @map("birth_date")
  dataSource     String  @default("wikidata") @map("data_source")
  schemaVersion  String  @default("1") @map("schema_version")
  createdAt      String  @map("created_at")
  other          String  @default("{}")

  @@index([ethnicity])
  @@index([gender])
  @@index([category])
  @@index([birthDate])
  @@map("people")
}
```

Rules for the columns:

- `birthDate` and `createdAt` hold ISO 8601 strings. String comparison on `birthDate` is valid for age filtering.
- `gender` is "male" or "female".
- `other` holds JSON text with every non-common attribute, for example `birthPlace`, `nativeName`, `languageSpoken`, `educatedAt`, `imdbId`, `twitterUsername`. Parse it with a small typed helper `parseOther(person)` that returns `Record<string, unknown>` and never throws on bad JSON.
- `category` is null until an occupation mapping fills it.

### Seed script

Write `prisma/seed.ts` that reads `data/people.json` (an array of records) and upserts into `Person`. Map the original keys to columns as follows. `_id` goes to `mongoId`, and `nationalityQId` goes to `nationalityQid`. Every other common key keeps its name. Treat empty strings as null. Every key that is not a common key goes into `other` as JSON text. Do not invent records. If `data/people.json` is missing, stop and tell me instead of generating fake data.

### Photo URLs

The stored `imageUrl` points to full-size Wikimedia Commons files. Write `lib/image.ts` with `toThumbUrl(imageUrl, width = 600)` that extracts the file name from the Commons URL and returns `https://commons.wikimedia.org/wiki/Special:FilePath/<file name>?width=<width>`. Use plain `<img>` tags with this URL, not `next/image`, to avoid a second resize hop. Add a comment that a later step should download and resize photos into our own storage, because hotlinking Commons is rate-limited.

## Pre-quiz setup screen

This is the home screen. Use shadcn components.

1. Number of questions. `ToggleGroup` with 10, 30, 50, 100. Default 10.
2. Timer. `Switch`, default on. When on, each question gets 15 seconds. Keep the duration in one constant.
3. Gender of the people in the photos. `ToggleGroup` with Male, Female, Any. Default Any.
4. Age range. A two-handle `Slider` for the person's current age, default 10 to 90, with the chosen range shown as text.
5. Category. A `Select` with these values, default "All Categories": All Categories, Arts & Entertainment, Business & Finance, Creative & Design, Digital Content, Education, Entertainment Industry, Government & Politics, Legal, Media & Journalism, Medical & Healthcare, Military & Defense, Religious & Spiritual, Science & Research, Sports, Sports Management & Coaching, Technology, Traditional Arts & Culture.

Put the list in `lib/categories.ts`, plus an empty `OCCUPATION_TO_CATEGORY` record I will fill in later. A full-width "Start quiz" button sits at the bottom of the screen. If the filters match fewer people than the chosen question count, lower the count to the pool size and show a short notice. If the pool has no matches, disable Start and say why.

## tRPC API

Set up the route handler at `app/api/trpc/[trpc]/route.ts` and a Prisma client singleton in `lib/db.ts`.

- `meta.setupInfo`. Returns the category list and the number of matching people for the current filters, so the setup screen can show a live count.
- `quiz.start`. Input is `{ count, gender, ageMin, ageMax, category }`. It does the following:
  1. Selects ids of matching people. Convert the age range to a `birthDate` range from today's date. Skip people with no `birthDate` when an age filter other than the full range is set. Skip category filtering when the category is "All Categories".
  2. Shuffles the ids with Fisher-Yates and takes `count`.
  3. For each person, builds four options. One is the correct ethnicity. Three are other distinct ethnicities picked at random from all ethnicities in the database, not just the filtered pool. Shuffle the options.
  4. Returns the full question list in one response. Each question has `id`, `imageUrl` (already passed through `toThumbUrl`), `options` (array of ethnicity strings), `correct` (the correct ethnicity string), and a `reveal` object with `name`, `description`, `occupation`, `birthPlace` (from `other`, optional), `wikipediaEnUrl`, and `commonsUrl` (the original `imageUrl`, for photo credit).

This is a casual game, so ship `correct` with the question set to get instant feedback. Add a code comment saying so.

## Quiz screen

Layout. Use `h-dvh` with a flex column and respect safe-area insets. The top bar shows the question counter ("3 / 10"), the score, and the timer as a shadcn `Progress` bar that turns red in the last 3 seconds. Below that is the photo, which fills the available width with a 4:5 aspect ratio, `object-cover`, and `object-position: top` so faces stay in frame. The answer options and the action button sit in the lower part of the screen, inside the thumb zone.

### Answer options

Use shadcn `RadioGroup`. Make it look like Google Forms.

- The four options are stacked vertically, one per row, each row full width.
- Each row is a bordered, rounded container with the content laid out horizontally in this order. The radio circle on the left, then the country flag, then the ethnicity text.
- The whole row is a `label`, so tapping anywhere inside the border selects it. Minimum row height is 56 px.
- Selected state. The border and background change using `data-[state=checked]`. Do not rely on color alone, since the filled radio circle also shows the selection.
- After the user confirms, color the correct row green. If the user chose a wrong row, color that row red.
- Disable the group after confirming.
- A sticky bottom button reads "Check answer" while no answer is confirmed, and is disabled until a row is selected. After confirming, it reads "Next" (or "See results" on the last question).

Flags. Write `lib/flags.ts` with a `ETHNICITY_TO_COUNTRY` record that maps an ethnicity string to an ISO 3166-1 alpha-2 code (for example Korean to "kr", Vietnamese to "vn"). Query the distinct `ethnicity` values from the database and build the map from them. Where an ethnicity has no matching country flag, fall back to a lucide `Globe` icon. List every fallback in your final report. Mark the flag `aria-hidden`, because the text carries the meaning.

Build this as a standalone `OptionList` component with props `options`, `value`, `onChange`, `status`, so I can later swap it for a swipe-based input without touching the rest of the quiz.

### Reveal

After the user confirms, show a reveal card under the options. On a phone, use a shadcn `Drawer` that slides up. On wider screens, use a `Card`. Contents are the person's name, description, occupation, birthplace if present, a link to Wikipedia if present, and a small "Photo: Wikimedia Commons" link. The Next button stays reachable.

### Timer

When the timer is on, it starts only after the current photo has finished decoding, not when the question appears. If it reaches zero, record the question as unanswered (counts as wrong), show the reveal, and highlight the correct row.

### Scoring

One point per correct answer. Keep a streak counter and show it when it reaches 3 or more. Do not add a speed bonus yet.

## Image preloading (required)

The next photo must be decoded and ready before the user reaches it. Implement it this way.

- Write a hook `usePreloadImages(urls, currentIndex, ahead = 3)`.
- On every change of `currentIndex`, start loading the photos for `currentIndex + 1` through `currentIndex + ahead` that are not loaded yet. For each, create `new Image()`, set `src`, then `await img.decode()`.
- Keep the `Image` objects in a `useRef` map keyed by URL so the browser does not discard them. Ignore decode errors and mark that URL as failed.
- Preload the current photo plus the first `ahead` photos before leaving the setup screen's loading state. Show a short loading state with a shadcn `Skeleton` and wait for the first photo only. The rest load in the background.
- Show a skeleton in the photo area only if the user reaches a photo that has not finished decoding. Do not render a half-loaded photo.
- If a photo fails to load, skip that question and continue. Do not crash.
- Use the same URL string for preloading and for the `<img src>` so the browser cache is hit.

## Results screen

Show the final score and accuracy percentage. Show a per-ethnicity breakdown as a list of rows, each with the ethnicity, correct and total counts, and a `Progress` bar. Add a "Most confused" line naming the ethnicity the user most often picked wrongly and the ethnicity it replaced. Add "Play again" (same settings) and "Change settings" buttons.

## State management

Use React state with `useReducer` in a `QuizProvider`. Do not use `localStorage` or `sessionStorage`. Do not persist anything for now.

## Mobile requirements

- All tap targets are at least 48 px.
- Do not depend on hover.
- Set `touch-action: manipulation` on interactive elements to prevent double-tap zoom.
- Test at 375 px width with the browser device toolbar before reporting done.

## Project structure

```
app/
  page.tsx                  setup screen
  quiz/page.tsx             quiz screen
  results/page.tsx          results screen
  api/trpc/[trpc]/route.ts
components/
  quiz/OptionList.tsx
  quiz/RevealCard.tsx
  quiz/TimerBar.tsx
  ui/                       shadcn components
lib/
  db.ts  image.ts  flags.ts  categories.ts  other.ts
server/
  trpc.ts  routers/
prisma/
  schema.prisma  seed.ts
```

## Rules

- Do not fabricate people, ethnicities, or flags. Use only what is in the database.
- Do not add features that are not listed here. Swipe gestures, lifelines, a daily challenge, sound, and a leaderboard come later.
- Prefer small, typed functions. Run `tsc --noEmit` and the linter before finishing and fix every error.
- Work in this order. 1) Project setup and Prisma schema and seed. 2) tRPC and `quiz.start`. 3) Setup screen. 4) Quiz screen with `OptionList`. 5) Preloading. 6) Reveal. 7) Results. After each step, run the app and confirm the step works before starting the next.

## Final report

When done, report the following. The commands to run the app and the seed. Any ethnicity that fell back to the globe icon. How many people have a null `category`. Any place where you deviated from this prompt and why.
