import { metaRouter } from "@/server/routers/meta";
import { quizRouter } from "@/server/routers/quiz";
import { router } from "@/server/trpc";

export const appRouter = router({
  meta: metaRouter,
  quiz: quizRouter,
});

export type AppRouter = typeof appRouter;
