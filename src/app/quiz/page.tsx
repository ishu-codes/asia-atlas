"use client";

import { Flame, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { OptionList } from "@/components/quiz/OptionList";
import { useQuiz } from "@/components/quiz/QuizProvider";
import { RevealCard } from "@/components/quiz/RevealCard";
import { TimerBar } from "@/components/quiz/TimerBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useImageStatus, usePreloadImages } from "@/hooks/use-preload-images";

export default function QuizPage() {
  const router = useRouter();
  const { state, dispatch } = useQuiz();
  const scrollRef = useRef<HTMLDivElement>(null);
  const skippedRef = useRef<Set<number>>(new Set());

  const question = state.questions[state.currentIndex];
  const questionUrls = useMemo(
    () => state.questions.map((item) => item.imageUrl),
    [state.questions],
  );

  usePreloadImages(questionUrls, state.currentIndex, 3);

  const imageStatus = useImageStatus(question?.imageUrl ?? "");
  const answer = question
    ? state.answers.find((item) => item.questionId === question.id)
    : undefined;
  const confirmed = answer !== undefined;

  const [selection, setSelection] = useState<{
    questionId: number | null;
    value: string | null;
  }>({ questionId: null, value: null });

  const selected =
    selection.questionId === question?.id
      ? selection.value
      : (answer?.selected ?? null);

  function setSelected(value: string) {
    if (question) {
      setSelection({ questionId: question.id, value });
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: moving to a new question must scroll the photo back into view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.currentIndex]);

  useEffect(() => {
    if (state.status === "idle") {
      router.replace("/");
    }
  }, [state.status, router]);

  useEffect(() => {
    if (state.status === "finished") {
      router.replace("/results");
    }
  }, [state.status, router]);

  useEffect(() => {
    if (!question || imageStatus !== "failed") return;
    if (skippedRef.current.has(question.id)) return;

    skippedRef.current.add(question.id);
    dispatch({ type: "SKIP_QUESTION", questionId: question.id });
  }, [question, imageStatus, dispatch]);

  function handleConfirm() {
    if (!question || confirmed || selected === null) return;
    dispatch({ type: "CONFIRM", selected });
  }

  function handleNext() {
    dispatch({ type: "NEXT" });
  }

  function handleExpire() {
    if (!question || confirmed) return;
    dispatch({ type: "CONFIRM", selected: null, timedOut: true });
  }

  if (state.status === "idle" || !question) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </main>
    );
  }

  const total = state.questions.length;
  const isLast = state.currentIndex >= total - 1;
  const timerRunning =
    state.settings.timer &&
    imageStatus === "ready" &&
    !confirmed &&
    state.status === "running";

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border/60 bg-background/90 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.7rem)] backdrop-blur sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-3xl leading-none tabular-nums text-foreground">
                {state.currentIndex + 1}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                / {total}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {state.streak >= 3 ? (
                <Badge
                  variant="secondary"
                  className="h-7 gap-1 px-2 tabular-nums"
                >
                  <Flame
                    className="size-3.5 text-orange-600"
                    aria-hidden="true"
                  />
                  {state.streak} streak
                </Badge>
              ) : null}
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Score
                </p>
                <p className="text-lg leading-none font-semibold tabular-nums text-foreground">
                  {state.score}
                </p>
              </div>
            </div>
          </div>

          {state.settings.timer ? (
            <div className="mt-2">
              <TimerBar
                running={timerRunning}
                resetKey={question.id}
                onExpire={handleExpire}
              />
            </div>
          ) : null}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2 sm:px-8 lg:overflow-hidden lg:py-0"
      >
        <div className="mx-auto w-full max-w-6xl lg:grid lg:h-full lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.78fr)] lg:items-stretch lg:gap-10 lg:py-6 xl:gap-16">
          <section className="flex min-h-0 items-center justify-center">
            <div className="mx-auto flex w-full justify-center lg:h-full lg:min-h-0">
              <div className="relative aspect-[4/5] w-full max-w-[min(100%,calc((100dvh-25.5rem)*0.8))] overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 lg:h-full lg:max-h-[calc(100dvh-11rem)] lg:w-auto lg:max-w-full lg:rounded-3xl">
                {imageStatus === "ready" ? (
                  // biome-ignore lint/performance/noImgElement: Commons URLs are already resized by width; next/image would add a second resize hop.
                  <img
                    key={question.imageUrl}
                    src={question.imageUrl}
                    alt="Person to identify"
                    className="h-full w-full object-cover object-top"
                    draggable={false}
                    decoding="async"
                  />
                ) : (
                  <Skeleton className="absolute inset-0 rounded-none" />
                )}
              </div>
            </div>
          </section>

          <section className="mt-3 min-w-0 lg:mt-0 lg:flex lg:min-h-0 lg:flex-col lg:justify-center lg:overflow-y-auto lg:py-3">
            <OptionList
              options={question.options}
              value={selected}
              onChange={setSelected}
              status={{ confirmed, correct: question.correct }}
            />

            <p aria-live="polite" className="sr-only">
              {confirmed
                ? answer?.timedOut
                  ? `Time is up. The answer is ${question.correct}.`
                  : answer?.correct
                    ? "Correct."
                    : `Incorrect. The answer is ${question.correct}.`
                : ""}
            </p>

            <div className="mt-4">
              <RevealCard open={confirmed} reveal={question.reveal} />
            </div>
          </section>
        </div>
      </div>

      <footer className="z-[60] shrink-0 border-t border-border/60 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2.5 backdrop-blur sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <Button
            size="lg"
            className="h-14 w-full rounded-xl text-base font-semibold lg:ml-auto lg:max-w-md"
            disabled={!confirmed && selected === null}
            onClick={confirmed ? handleNext : handleConfirm}
          >
            {confirmed ? (isLast ? "See results" : "Next") : "Check answer"}
          </Button>
        </div>
      </footer>
    </main>
  );
}
