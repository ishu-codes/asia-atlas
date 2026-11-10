import { initTRPC } from "@trpc/server";
import { db } from "@/lib/db";

export function createContext() {
  return { db };
}

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
