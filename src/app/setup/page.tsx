"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, Compass, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useStartRound } from "@/hooks/use-start-round";
import { ALL_CATEGORIES, CATEGORIES, type Category } from "@/lib/categories";
import {
  AGE_MAX,
  AGE_MIN,
  DEFAULT_QUESTION_COUNT,
  type GenderFilter,
  QUESTION_COUNTS,
  TIMER_SECONDS,
} from "@/lib/quiz";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const CATEGORY_ITEMS = CATEGORIES.map((category) => ({
  value: category,
  label: category,
}));

const GENDER_OPTIONS: { value: GenderFilter; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "any", label: "Any" },
];

function StartingScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-5 py-8 sm:px-8">
      <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1fr)] lg:gap-16">
        <Skeleton className="mx-auto aspect-[4/5] w-full max-w-md rounded-3xl" />
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Preparing your first photo...
        </div>
      </div>
    </main>
  );
}

export default function SetupPage() {
  const [count, setCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const [timer, setTimer] = useState(true);
  const [gender, setGender] = useState<GenderFilter>("any");
  const [ageRange, setAgeRange] = useState<number[]>([AGE_MIN, AGE_MAX]);
  const [category, setCategory] = useState<Category>(ALL_CATEGORIES);
  const { startRound, starting, error } = useStartRound();

  const ageMin = ageRange[0] ?? AGE_MIN;
  const ageMax = ageRange[1] ?? AGE_MAX;

  const filters = useMemo(
    () => ({ gender, ageMin, ageMax, category }),
    [gender, ageMin, ageMax, category],
  );
  const debouncedFilters = useDebouncedValue(filters, 200);

  const setupInfo = trpc.meta.setupInfo.useQuery(debouncedFilters, {
    placeholderData: keepPreviousData,
  });

  const total = setupInfo.data?.total ?? 0;
  const loadingCount = setupInfo.isLoading && !setupInfo.data;
  const noMatches = !loadingCount && total === 0;
  const effectiveCount = total > 0 ? Math.min(count, total) : count;
  const reducedCount = !loadingCount && total > 0 && total < count;

  function handleStart() {
    const settings = {
      count: effectiveCount,
      timer,
      gender,
      ageMin,
      ageMax,
      category,
    };

    void startRound(settings);
  }

  function handleGenderChange(values: string[]) {
    const next = values[0];
    if (next === "male" || next === "female" || next === "any") {
      setGender(next);
    }
  }

  function handleAgeChange(value: number | readonly number[]) {
    const next = Array.isArray(value) ? value : [value];
    if (next.length >= 2) {
      setAgeRange([next[0], next[1]]);
    }
  }

  if (starting) {
    return <StartingScreen />;
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-8 lg:pb-12 lg:pt-12">
      <div
        aria-hidden="true"
        className="atlas-setup-glow pointer-events-none absolute inset-0"
      />

      <div className="relative grid flex-1 gap-9 lg:grid-cols-[minmax(0,0.82fr)_minmax(30rem,1.18fr)] lg:items-start lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-12 lg:pt-14">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Home
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <Compass className="size-4" aria-hidden="true" />
            Asia Atlas
          </div>
          <h1 className="mt-4 max-w-2xl font-heading text-[2.9rem] leading-[0.94] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
            Guess the face.
            <br />
            Learn the <span className="text-primary">story.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground lg:mt-7 lg:text-base">
            Four possible ethnicities. One real person behind every photo. Pick
            an answer, then find out who you were looking at.
          </p>
        </header>

        <div className="relative min-w-0">
          <section className="mt-1 lg:mt-0">
            <Card className="rounded-2xl border border-border/80 shadow-[0_18px_50px_-30px_oklch(0.3_0.04_60/0.45)] ring-0 lg:rounded-3xl">
              <CardContent className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-6 lg:space-y-0 lg:p-6">
                <div className="space-y-2.5 lg:col-span-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Questions
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      per round
                    </span>
                  </div>
                  <ToggleGroup
                    aria-label="Number of questions"
                    value={[String(count)]}
                    onValueChange={(values) => {
                      const next = Number(values[0]);
                      if (
                        QUESTION_COUNTS.includes(
                          next as (typeof QUESTION_COUNTS)[number],
                        )
                      ) {
                        setCount(next);
                      }
                    }}
                    className="grid w-full grid-cols-4 gap-1 rounded-xl bg-muted p-1"
                  >
                    {QUESTION_COUNTS.map((option) => (
                      <ToggleGroupItem
                        key={option}
                        value={String(option)}
                        className="h-12 rounded-lg text-sm font-semibold text-muted-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-sm"
                      >
                        {option}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-3.5 py-2">
                  <div>
                    <Label
                      htmlFor="timer"
                      className="text-sm font-semibold text-foreground"
                    >
                      Timer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {TIMER_SECONDS} seconds per question
                    </p>
                  </div>
                  <Switch
                    id="timer"
                    checked={timer}
                    onCheckedChange={setTimer}
                    aria-label="Enable timer"
                  />
                </div>

                <div className="space-y-2.5">
                  <h2 className="text-sm font-semibold text-foreground">
                    Photos of
                  </h2>
                  <ToggleGroup
                    aria-label="Gender of people in the photos"
                    value={[gender]}
                    onValueChange={handleGenderChange}
                    className="grid w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className="h-12 rounded-lg text-sm font-semibold text-muted-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-sm"
                      >
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Age range
                    </h2>
                    <Badge variant="secondary" className="tabular-nums">
                      {ageMin}-{ageMax}
                    </Badge>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={ageRange}
                      onValueChange={handleAgeChange}
                      min={AGE_MIN}
                      max={AGE_MAX}
                      step={1}
                      thumbLabels={["Minimum age", "Maximum age"]}
                    />
                    <div className="mt-3 flex justify-between text-[11px] font-medium text-muted-foreground">
                      <span>{AGE_MIN}</span>
                      <span>{AGE_MAX}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 lg:col-span-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Category
                  </h2>
                  <Select
                    items={CATEGORY_ITEMS}
                    value={category}
                    onValueChange={(value) => {
                      if (value) setCategory(value as Category);
                    }}
                  >
                    <SelectTrigger className="h-12 w-full rounded-xl bg-background/60 px-3.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(22rem,var(--available-height))]">
                      {CATEGORIES.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          className="min-h-12 py-2.5"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  noMatches ? "bg-red-500" : "bg-emerald-600",
                )}
              />
              {loadingCount ? (
                <Skeleton className="h-4 w-40" />
              ) : noMatches ? (
                <span>No people match these filters.</span>
              ) : (
                <span>
                  <strong className="font-semibold text-foreground">
                    {total.toLocaleString()}
                  </strong>{" "}
                  people match these filters
                </span>
              )}
            </div>

            {reducedCount ? (
              <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                Only {total.toLocaleString()}{" "}
                {total === 1 ? "person matches" : "people match"}. This round
                will have {effectiveCount}{" "}
                {effectiveCount === 1 ? "question" : "questions"}.
              </p>
            ) : null}

            {noMatches ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Widen the age range, choose Any, or pick All Categories to
                start.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Could not start the quiz. {error.message}
              </p>
            ) : null}

            <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground lg:text-left">
              Ethnicity labels come from Wikidata records, never from the photo.
            </p>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-xl bg-linear-to-t from-background via-background/95 to-transparent px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 lg:static lg:mt-5 lg:max-w-none lg:bg-none lg:p-0">
            <Button
              size="lg"
              className="h-14 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 lg:shadow-md"
              disabled={noMatches || loadingCount || starting}
              onClick={handleStart}
            >
              {starting ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="size-5" aria-hidden="true" />
              )}
              Start quiz
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
