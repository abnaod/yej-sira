import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const listQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
});

/**
 * User role mutations. Admin can toggle between customer / admin.
 * Demoting the last remaining admin is blocked at the route layer.
 */
export const patchUserSchema = z.object({
  role: z.enum(["customer", "admin"]).optional(),
});

export const patchShopStatusSchema = z.object({
  status: z.enum(["pending", "active", "rejected", "suspended"]),
});

export const patchListingSchema = z.object({
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
});

/**
 * Order status transitions an admin can force (bypassing seller workflow).
 * `cancelled` is terminal; moving to `fulfilled` implies payment already captured.
 */
export const patchOrderSchema = z.object({
  status: z.enum(["pending", "awaiting_payment", "paid", "fulfilled", "cancelled"]),
});

const categorySlugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const createCategorySchema = z.object({
  slug: categorySlugSchema,
  name: z.string().min(1).max(120),
  nameAm: z.string().min(1).max(120).optional(),
  imageUrl: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

export const patchCategorySchema = z.object({
  slug: categorySlugSchema.optional(),
  name: z.string().min(1).max(120).optional(),
  nameAm: z.string().min(1).max(120).nullable().optional(),
  imageUrl: z.string().min(1).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
});

const promotionSlugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const createPromotionSchema = z.object({
  slug: promotionSlugSchema,
  title: z.string().min(1).max(160),
  subtitle: z.string().max(300).optional(),
  badgeLabel: z.string().min(1).max(60),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  heroImageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  priority: z.coerce.number().int().min(0).max(10000).default(0),
  titleAm: z.string().max(160).optional(),
  subtitleAm: z.string().max(300).optional(),
  badgeLabelAm: z.string().max(60).optional(),
});

export const patchPromotionSchema = createPromotionSchema.partial();
