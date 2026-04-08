import { z } from "zod";

export const cartItemBodySchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const cartItemPatchSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const promoCodeSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
});
