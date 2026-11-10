"use client";

import { Compass, Loader2, RotateCcw, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { EthnicityFlag } from "@/components/quiz/EthnicityFlag";
import { useQuiz } from "@/components/quiz/QuizProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStartRound } from "@/hooks/use-start-round";
import { cn } from "@/lib/utils";
import Navbar from "@/components/app/Navbar";

type EthnicityRow = {
  ethnicity: string;
  correct: number;
  total: number;
};

type ConfusionRow = {
  picked: string;
  correct: string;
  count: number;
};

export default function ResultsPage() {
  const router = useRouter();
  const { state } = useQuiz();
  const { startRound, starting, error } = useStartRound();

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/");
    } else if (state.status === "running") {
      router.replace("/quiz");
    }
  }, [state.status, router]);

  const answered = useMemo(() => state.answers.filter((answer) => !answer.skipped), [state.answers]);

  const total = answered.length;
  const accuracy = total > 0 ? Math.round((state.score / total) * 100) : 0;

  const breakdown = useMemo(() => {
    const rows = new Map<string, EthnicityRow>();

    for (const answer of answered) {
      const question = state.questions.find((item) => item.id === answer.questionId);
      if (!question) continue;

      const row = rows.get(question.correct) ?? {
        ethnicity: question.correct,
        correct: 0,
        total: 0,
      };

      row.total += 1;
      if (answer.correct) row.correct += 1;
      rows.set(question.correct, row);
    }

    return [...rows.values()].sort((a, b) => b.total - a.total || a.ethnicity.localeCompare(b.ethnicity));
  }, [answered, state.questions]);

  const mostConfused = useMemo<ConfusionRow | null>(() => {
    const counts = new Map<string, ConfusionRow>();

    for (const answer of answered) {
      if (answer.correct || answer.selected === null) continue;
      const question = state.questions.find((item) => item.id === answer.questionId);
      if (!question) continue;

      const key = `${answer.selected}->${question.correct}`;
      const row = counts.get(key) ?? {
        picked: answer.selected,
        correct: question.correct,
        count: 0,
      };
      row.count += 1;
      counts.set(key, row);
    }

    return [...counts.values()].sort((a, b) => b.count - a.count)[0] ?? null;
  }, [answered, state.questions]);

  async function handlePlayAgain() {
    await startRound(state.settings);
  }

  function handleChangeSettings() {
    router.push("/setup");
  }

  if (state.status !== "finished") {
    return (
      <main className="flex h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-8 lg:pt-14">
      <Navbar />

      <header className="mt-4 max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Round complete</p>
        <h1 className="mt-3 font-heading text-5xl leading-[0.95] tracking-tight lg:text-6xl">
          Here is how
          <br />
          you <span className="text-primary">did.</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You identified {state.score} of {total} {total === 1 ? "person" : "people"} correctly.
        </p>
      </header>

      <div className="mt-6 grid flex-1 content-start gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-8">
        <Card className="overflow-hidden rounded-2xl border border-border/80 shadow-[0_18px_50px_-30px_oklch(0.3_0.04_60/0.45)] ring-0 lg:col-start-1 lg:row-start-1 lg:rounded-3xl">
          <CardContent className="space-y-4 lg:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Final score
                </p>
                <p className="font-heading text-6xl leading-none tabular-nums text-foreground lg:text-7xl">
                  {state.score}
                  <span className="text-2xl text-muted-foreground"> / {total}</span>
                </p>
              </div>
              <Badge variant="secondary" className="mb-1 tabular-nums">
                {accuracy}% accurate
              </Badge>
            </div>
            <Progress
              value={accuracy}
              aria-label="Accuracy"
              className={cn("flex-col gap-0 [&_[data-slot=progress-track]]:h-2")}
            />
          </CardContent>
        </Card>

        <section className="mt-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">By ethnicity</h2>
            <span className="text-xs text-muted-foreground">correct / seen</span>
          </div>

          {breakdown.length > 0 ? (
            <div className="mt-2.5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {breakdown.map((row) => {
                const percent = row.total > 0 ? (row.correct / row.total) * 100 : 0;

                return (
                  <div key={row.ethnicity} className="space-y-2 px-4 py-3 lg:px-5 lg:py-4">
                    <div className="flex items-center gap-2.5">
                      <EthnicityFlag ethnicity={row.ethnicity} />
                      <span className="flex-1 text-sm font-medium text-foreground">{row.ethnicity}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {row.correct} / {row.total}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      aria-label={`${row.ethnicity} accuracy`}
                      className="flex-col gap-0 [&_[data-slot=progress-track]]:h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2.5 rounded-xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
              No answered questions to break down.
            </p>
          )}
        </section>

        <div className="rounded-xl bg-accent/60 px-4 py-3.5 text-sm text-accent-foreground lg:col-start-1 lg:row-start-2 lg:px-5 lg:py-4">
          {mostConfused ? (
            <>
              <span className="font-semibold">Most confused:</span> you picked{" "}
              <span className="font-semibold">{mostConfused.picked}</span> when the answer was{" "}
              <span className="font-semibold">{mostConfused.correct}</span>
              {mostConfused.count > 1 ? ` (${mostConfused.count} times)` : ""}.
            </>
          ) : (
            <>
              <span className="font-semibold">No mixed-up answers.</span> Every pick you made was on the mark.
            </>
          )}
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive lg:col-span-2">
            Could not start another round. {error.message}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-4 lg:col-span-2 lg:ml-auto lg:grid lg:w-full lg:max-w-xl lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:pt-2">
          <Button
            size="lg"
            className="h-14 w-full rounded-xl text-base font-semibold"
            disabled={starting}
            onClick={handlePlayAgain}
          >
            {starting ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="size-5" aria-hidden="true" />
            )}
            Play again
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 w-full rounded-xl text-sm font-semibold"
            onClick={handleChangeSettings}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Change settings
          </Button>
        </div>
      </div>
    </main>
  );
}
