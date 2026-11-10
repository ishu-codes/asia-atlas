import { CATEGORIES } from "@/lib/categories";
import { toThumbUrl } from "@/lib/image";
import { buildPersonWhere } from "@/server/person-where";
import { filtersSchema } from "@/server/routers/schemas";
import { publicProcedure, router } from "@/server/trpc";

export const metaRouter = router({
  home: publicProcedure.query(async ({ ctx }) => {
    const [total, ethnicityRows, categoryRows, candidates] = await Promise.all([
      ctx.db.person.count(),
      ctx.db.person.findMany({
        distinct: ["ethnicity"],
        select: { ethnicity: true },
        orderBy: { ethnicity: "asc" },
      }),
      ctx.db.person.findMany({
        distinct: ["category"],
        select: { category: true },
        where: { category: { not: null } },
      }),
      ctx.db.person.findMany({
        where: {
          imageUrl: { not: "" },
          occupation: { not: null },
        },
        select: {
          name: true,
          description: true,
          occupation: true,
          imageUrl: true,
          ethnicity: true,
        },
        take: 60,
      }),
    ]);

    const spotlight = candidates
      .map((person) => ({
        ...person,
        imageUrl: toThumbUrl(person.imageUrl, 900),
      }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return {
      total,
      ethnicities: ethnicityRows.map((row) => row.ethnicity),
      categoryCount: categoryRows.length,
      spotlight,
    };
  }),
  setupInfo: publicProcedure
    .input(filtersSchema)
    .query(async ({ ctx, input }) => {
      const total = await ctx.db.person.count({
        where: buildPersonWhere(input),
      });

      return {
        categories: CATEGORIES,
        total,
      };
    }),
});
