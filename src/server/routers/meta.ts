import { CATEGORIES } from "@/lib/categories";
import { toThumbUrl } from "@/lib/image";
import {
  filterPeople,
  getAllEthnicities,
  getAllPeople,
  getCategoryCount,
  shuffle,
} from "@/server/people-data";
import { filtersSchema } from "@/server/routers/schemas";
import { publicProcedure, router } from "@/server/trpc";

export const metaRouter = router({
  home: publicProcedure.query(() => {
    const people = getAllPeople();
    const candidates = people
      .filter((person) => person.occupation)
      .slice(0, 60);
    const spotlight = shuffle(candidates)
      .slice(0, 3)
      .map((person) => ({
        name: person.name,
        description: person.description,
        occupation: person.occupation,
        ethnicity: person.ethnicity,
        imageUrl: toThumbUrl(person.imageUrl, 900),
      }));

    return {
      total: people.length,
      ethnicities: getAllEthnicities(),
      categoryCount: getCategoryCount(),
      spotlight,
    };
  }),
  setupInfo: publicProcedure.input(filtersSchema).query(({ input }) => ({
    categories: CATEGORIES,
    total: filterPeople(input).length,
  })),
});
