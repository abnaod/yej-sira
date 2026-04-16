import { z } from "zod";

export const listingReviewsQuerySchema = z.object({
  take: z.coerce.number().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
});

export const listingReviewPostSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});
