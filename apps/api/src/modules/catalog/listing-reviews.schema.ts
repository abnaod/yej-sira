import { z } from "zod";

export const productReviewsQuerySchema = z.object({
  take: z.coerce.number().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
});

export const productReviewPostSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});
