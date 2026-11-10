import { CATEGORIES } from "@/lib/categories";
import { buildPersonWhere } from "@/server/person-where";
import { filtersSchema } from "@/server/routers/schemas";
import { publicProcedure, router } from "@/server/trpc";

export const metaRouter = router({
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
