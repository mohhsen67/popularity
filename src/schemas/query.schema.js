import { z } from "zod";

export const querySchema = z.object({
  language: z.string().min(1, "language is required"),
  created_after: z
    .string()
    .min(1, "created_after is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "created_after must be an ISO-8601 date (e.g., 2024-01-01)",
    }),
  q: z.string().optional(),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).max(10).default(1),
});
