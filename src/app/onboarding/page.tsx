"use client";

import { ArrowLeft, ArrowRight, Compass, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PortraitDeck } from "@/components/app/PortraitDeck";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { EthnicityFlag } from "@/components/quiz/EthnicityFlag";
import { OptionList } from "@/components/quiz/OptionList";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import Navbar from "@/components/app/Navbar";

const STEPS = [
  {
    title: "Every photo is a real person.",
    copy: "Pick their ethnicity from four choices. Then the photo becomes a story: a name, an occupation, and a place in the atlas.",
  },
  {
    title: "Make your first guess.",
    copy: "This practice round does not count. Choose an answer, check it, and see how the reveal works.",
  },
  {
    title: "Build a trail as you play.",
    copy: "Each ethnicity you meet lights up for the session. Your round also tracks score, streak, and the people you identify.",
  },
] as const;

const PRACTICE_SKELETON_KEYS = ["one", "two", "three", "four"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const homeInfo = trpc.meta.home.useQuery();
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const person = homeInfo.data?.spotlight[0];
  const ethnicities = homeInfo.data?.ethnicities ?? [];

  const practiceOptions = useMemo(() => {
    if (!person) return [];

    const distractors = ethnicities
      .filter((ethnicity) => ethnicity !== person.ethnicity)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return [person.ethnicity, ...distractors].sort(() => Math.random() - 0.5);
  }, [ethnicities, person]);

  const current = STEPS[step];
  const isPractice = step === 1;
  const isLast = step === STEPS.length - 1;
  const primaryDisabled = (isPractice && selection === null) || (isPractice && homeInfo.isLoading);

  function handleContinue() {
    if (isPractice && !checked) {
      setChecked(true);
      return;
    }

    if (isLast) {
      router.push("/");
      return;
    }

    setStep((value) => value + 1);
  }

  function handleBack() {
    setStep((value) => Math.max(0, value - 1));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-8">
      <Navbar />
      {/*<Link
        href="/"
        className="flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Skip
      </Link>*/}

      <div className="flex flex-1 flex-col justify-center py-5">
        <div
          className="flex items-center gap-2"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEPS.length}`}
        >
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                index <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-6 grid flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(26rem,1fr)] lg:gap-16">
          <div key={`visual-${step}`} className="atlas-onboarding-enter">
            {step === 0 ? <PortraitDeck people={homeInfo.data?.spotlight ?? []} loading={homeInfo.isLoading} /> : null}

            {step === 1 ? (
              <div className="mx-auto w-full max-w-sm">
                {person ? (
                  <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] border border-border bg-muted shadow-[0_24px_64px_-34px_oklch(0.28_0.04_70/0.55)]">
                    {/* biome-ignore lint/performance/noImgElement: Commons URLs are already resized; next/image would add a second resize hop. */}
                    <img
                      src={person.imageUrl}
                      alt={`Practice portrait of ${person.name}`}
                      className="h-full w-full object-cover object-top"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <Skeleton className="aspect-4/5 w-full rounded-[2rem]" />
                )}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="atlas-surface mx-auto flex min-h-72 w-full max-w-md flex-col justify-center rounded-[2rem] border border-border bg-card p-6">
                <div className="flex items-center justify-center gap-2">
                  {ethnicities.slice(0, 4).map((ethnicity, index) => (
                    <span
                      key={ethnicity}
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl border",
                        index < 2
                          ? "border-primary/25 bg-primary/10"
                          : "border-border bg-muted/40 opacity-50 grayscale",
                      )}
                    >
                      <EthnicityFlag ethnicity={ethnicity} />
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-center font-heading text-2xl font-bold">2 of 8 discovered</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">An example of your session trail</p>
              </div>
            ) : null}
          </div>

          <section
            key={`copy-${step}`}
            className="atlas-onboarding-enter lg:max-w-xl"
            aria-labelledby="onboarding-title"
          >
            <h1
              id="onboarding-title"
              className="font-heading text-4xl font-bold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl"
            >
              {current.title}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{current.copy}</p>

            {homeInfo.error ? (
              <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                Could not load a practice portrait. You can still skip the tutorial.
              </p>
            ) : null}

            {isPractice ? (
              <div className="mt-6">
                {homeInfo.isLoading ? (
                  <div className="space-y-2">
                    {PRACTICE_SKELETON_KEYS.map((key) => (
                      <Skeleton key={key} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : person ? (
                  <>
                    <OptionList
                      options={practiceOptions}
                      value={selection}
                      onChange={setSelection}
                      status={{
                        confirmed: checked,
                        correct: person.ethnicity,
                      }}
                    />
                    <div aria-live="polite" className="mt-4">
                      {checked ? (
                        <div className="rounded-2xl border border-border bg-card px-4 py-3">
                          <p className="text-sm font-semibold">
                            {selection === person.ethnicity ? "That is right." : `The answer is ${person.ethnicity}.`}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {person.name}
                            {person.occupation ? `, ${person.occupation.toLowerCase()}` : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">The practice portrait is unavailable right now.</p>
                )}
              </div>
            ) : null}

            <div className="mt-7 flex items-center gap-2.5">
              {step > 0 ? (
                <Button variant="outline" size="lg" className="h-13 rounded-2xl px-4" onClick={handleBack}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : null}
              <Button
                size="lg"
                className="h-13 min-w-44 flex-1 rounded-2xl text-base font-semibold sm:flex-none"
                disabled={primaryDisabled}
                onClick={handleContinue}
              >
                {isPractice && !checked ? "Check answer" : isLast ? "Enter home" : "Continue"}
                {isPractice && !checked ? null : <ArrowRight className="size-4" aria-hidden="true" />}
                {homeInfo.isLoading && isPractice ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
