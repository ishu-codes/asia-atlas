import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { AGE_MAX, AGE_MIN, GENDER_FILTERS } from "@/lib/quiz";

export const filtersSchema = z
  .object({
    gender: z.enum(GENDER_FILTERS),
    ageMin: z.number().int().min(AGE_MIN).max(AGE_MAX),
    ageMax: z.number().int().min(AGE_MIN).max(AGE_MAX),
    category: z.enum(CATEGORIES),
  })
  .refine((value) => value.ageMin <= value.ageMax, {
    message: "ageMin must be less than or equal to ageMax",
    path: ["ageMax"],
  });

export type FiltersInput = z.infer<typeof filtersSchema>;
