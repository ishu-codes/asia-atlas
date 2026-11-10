import { z } from "zod";
import { toThumbUrl } from "@/lib/image";
import { getString, parseOther } from "@/lib/other";
import type { QuizQuestion } from "@/lib/quiz";
import { buildPersonWhere } from "@/server/person-where";
import { filtersSchema } from "@/server/routers/schemas";
import { publicProcedure, router } from "@/server/trpc";

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const quizRouter = router({
  start: publicProcedure
    .input(filtersSchema.extend({ count: z.number().int().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const where = buildPersonWhere(input);

      const pool = await ctx.db.person.findMany({
        where,
        select: { id: true },
      });
      const ids = shuffle(pool.map((person) => person.id)).slice(
        0,
        input.count,
      );

      if (ids.length === 0) {
        return { questions: [] satisfies QuizQuestion[] };
      }

      const people = await ctx.db.person.findMany({
        where: { id: { in: ids } },
      });
      const byId = new Map(people.map((person) => [person.id, person]));

      const ethnicityRows = await ctx.db.person.findMany({
        distinct: ["ethnicity"],
        select: { ethnicity: true },
      });
      const allEthnicities = ethnicityRows.map((row) => row.ethnicity);

      const questions = ids.flatMap((id): QuizQuestion[] => {
        const person = byId.get(id);
        if (!person) return [];

        const distractors = shuffle(
          allEthnicities.filter((ethnicity) => ethnicity !== person.ethnicity),
        ).slice(0, 3);
        const options = shuffle([person.ethnicity, ...distractors]);
        const other = parseOther(person);

        return [
          {
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
              birthPlace: getString(other, "birthPlace"),
              wikipediaEnUrl: person.wikipediaEnUrl ?? undefined,
              commonsUrl: person.imageUrl,
            },
          },
        ];
      });

      return { questions };
    }),
});
