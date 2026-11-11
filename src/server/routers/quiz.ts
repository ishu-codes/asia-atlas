import { z } from "zod";
import { toThumbUrl } from "@/lib/image";
import { getString } from "@/lib/other";
import type { QuizQuestion } from "@/lib/quiz";
import { filterPeople, getAllEthnicities, shuffle } from "@/server/people-data";
import { filtersSchema } from "@/server/routers/schemas";
import { publicProcedure, router } from "@/server/trpc";

export const quizRouter = router({
  start: publicProcedure
    .input(filtersSchema.extend({ count: z.number().int().min(1).max(100) }))
    .mutation(({ input }) => {
      const people = shuffle(filterPeople(input)).slice(0, input.count);
      if (people.length === 0) {
        return { questions: [] satisfies QuizQuestion[] };
      }

      const allEthnicities = getAllEthnicities();
      const questions = people.map((person): QuizQuestion => {
        const distractors = shuffle(
          allEthnicities.filter((ethnicity) => ethnicity !== person.ethnicity),
        ).slice(0, 3);
        const options = shuffle([person.ethnicity, ...distractors]);

        return {
          id: person.id,
          imageUrl: toThumbUrl(person.imageUrl),
          options,
          // Casual game: shipping the answer key with the question is
          // intentional so the client can give instant feedback.
          correct: person.ethnicity,
          reveal: {
            name: person.name,
            ethnicity: person.ethnicity,
            description: person.description ?? undefined,
            occupation: person.occupation ?? undefined,
            birthPlace: getString(person.other, "birthPlace"),
            wikipediaEnUrl: person.wikipediaEnUrl ?? undefined,
            commonsUrl: person.imageUrl,
          },
        };
      });

      return { questions };
    }),
});
