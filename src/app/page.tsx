"use client";

import { ArrowRight, Check, Loader2, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AppTabBar } from "@/components/app/AppTabBar";
import { PortraitDeck } from "@/components/app/PortraitDeck";
import { EthnicityFlag } from "@/components/quiz/EthnicityFlag";
import { useQuiz } from "@/components/quiz/QuizProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStartRound } from "@/hooks/use-start-round";
import { DEFAULT_SETTINGS } from "@/lib/quiz";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import Navbar from "@/components/app/Navbar";

const TRAIL_SKELETON_KEYS = ["cn", "ph", "id", "jp", "kr", "my", "th", "vn"] as const;

export default function HomePage() {
  const router = useRouter();
  const { state } = useQuiz();
  const homeInfo = trpc.meta.home.useQuery();
  const { startRound, starting, error } = useStartRound();

  const activeSession = state.status === "running";
  const finishedSession = state.status === "finished" && state.answers.length > 0;
  const primaryLabel = activeSession ? "Resume round" : finishedSession ? "Play again" : "Start a round";

  const answeredQuestions = useMemo(() => {
    const answeredIds = new Set(state.answers.filter((answer) => !answer.skipped).map((answer) => answer.questionId));
    return state.questions.filter((question) => answeredIds.has(question.id));
  }, [state.answers, state.questions]);

  const discovered = useMemo(() => new Set(answeredQuestions.map((question) => question.correct)), [answeredQuestions]);

  const ethnicities = homeInfo.data?.ethnicities ?? [];
  const hasSession = state.answers.length > 0;

  async function handlePrimaryAction() {
    if (activeSession) {
      router.push("/quiz");
      return;
    }

    await startRound(finishedSession ? state.settings : DEFAULT_SETTINGS);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-8">
      <Navbar />

      <section className="atlas-home-enter mt-7 grid items-center gap-8 lg:mt-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.75fr)] lg:gap-20">
        <div>
          <h1 className="max-w-xl font-heading text-5xl leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
            Who is behind the photo?
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Guess the ethnicity, then meet the real person and hear their story.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Button
              size="lg"
              className="h-14 min-w-48 rounded-2xl px-6 text-base font-semibold shadow-md shadow-primary/15"
              disabled={starting}
              onClick={handlePrimaryAction}
            >
              {starting ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="size-5" aria-hidden="true" />
              )}
              {primaryLabel}
            </Button>
            <Link
              href="/setup"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-14 rounded-2xl px-5 text-sm font-semibold",
              )}
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Customize round
            </Link>
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              Could not start a round. {error.message}
            </p>
          ) : null}

          {hasSession ? (
            <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3 border-t border-border/70 pt-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">This session</dt>
                <dd className="mt-0.5 font-heading text-2xl font-bold tabular-nums">
                  {state.score}
                  <span className="text-sm font-medium text-muted-foreground"> / {answeredQuestions.length}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Current streak</dt>
                <dd className="mt-0.5 font-heading text-2xl font-bold tabular-nums">{state.streak}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <PortraitDeck people={homeInfo.data?.spotlight ?? []} loading={homeInfo.isLoading} />
      </section>

      <section className="mt-10 border-t border-border/70 pt-6 lg:mt-16 lg:grid lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] lg:gap-16">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">Your story trail</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Each ethnicity you meet in a round lights up here for this app session.
          </p>
          {!hasSession ? (
            <p className="mt-3 text-sm font-medium text-primary">Your first round starts the trail.</p>
          ) : (
            <p className="mt-3 text-sm font-medium text-foreground">
              {discovered.size} of {ethnicities.length || 8} discovered
            </p>
          )}
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-0">
          {homeInfo.isLoading
            ? TRAIL_SKELETON_KEYS.map((key) => (
                <li key={key}>
                  <Skeleton className="h-14 rounded-2xl" />
                </li>
              ))
            : ethnicities.map((ethnicity) => {
                const found = discovered.has(ethnicity);

                return (
                  <li
                    key={ethnicity}
                    className={cn(
                      "flex min-h-14 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                      found
                        ? "border-primary/25 bg-primary/8 text-foreground"
                        : "border-border/70 bg-muted/35 text-muted-foreground",
                    )}
                  >
                    <span className={cn(!found && "opacity-35 grayscale")}>
                      <EthnicityFlag ethnicity={ethnicity} />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{ethnicity}</span>
                    {found ? <Check className="size-4 shrink-0 text-primary" aria-label="Discovered" /> : null}
                  </li>
                );
              })}
        </ul>
      </section>

      {homeInfo.error ? (
        <p role="alert" className="mt-5 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          Could not load the atlas. {homeInfo.error.message}
        </p>
      ) : null}

      <AppTabBar />
    </main>
  );
}
