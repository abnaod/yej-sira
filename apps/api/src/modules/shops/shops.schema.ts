import { z } from "zod";

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

export const createShopBodySchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
});

export const adminShopListQuerySchema = z.object({
  status: z.enum(["pending", "active", "rejected", "suspended"]).optional(),
});

export const adminCreateShopBodySchema = z.object({
  ownerUserId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
  status: z.enum(["pending", "active", "rejected", "suspended"]).optional(),
});

export const adminPatchShopBodySchema = z.object({
  status: z.enum(["pending", "active", "rejected", "suspended"]).optional(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const publicShopProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
});
