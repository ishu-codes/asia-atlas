"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuiz } from "@/components/quiz/QuizProvider";
import { preloadImage, preloadImages } from "@/hooks/use-preload-images";
import type { QuizSettings } from "@/lib/quiz";
import { trpc } from "@/lib/trpc";

export function useStartRound() {
  const router = useRouter();
  const { dispatch } = useQuiz();
  const mutation = trpc.quiz.start.useMutation();
  const [starting, setStarting] = useState(false);

  async function startRound(settings: QuizSettings) {
    if (starting) return false;
    setStarting(true);

    try {
      const result = await mutation.mutateAsync(settings);
      if (result.questions.length === 0) {
        setStarting(false);
        return false;
      }

      const urls = result.questions.map((question) => question.imageUrl);

      // Wait only for the first photo. The next few decode in the background.
      await preloadImage(urls[0]);
      void preloadImages(urls.slice(1, 4));

      dispatch({ type: "START", settings, questions: result.questions });
      router.push("/quiz");
      return true;
    } catch {
      setStarting(false);
      return false;
    }
  }

  return {
    startRound,
    starting,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
