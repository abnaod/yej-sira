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

const shopSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

export const createAdminShopSchema = z.object({
  name: z.string().min(1).max(120),
  slug: shopSlugSchema,
  ownerEmail: z.string().email().optional(),
  status: z.enum(["pending", "active", "rejected", "suspended"]).default("active"),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().max(500).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  businessType: z.enum(["individual", "business"]).optional(),
  listingsLimit: z.coerce.number().int().min(1).max(10000).default(20),
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

const promoCodeRegex = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;

const promoCodeFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(promoCodeRegex, "Use uppercase letters, digits, dash or underscore")),
  description: z.string().max(500).optional(),
  discountPercent: z.coerce.number().int().min(1).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  minSubtotal: z.coerce.number().min(0).optional(),
  maxRedemptions: z.coerce.number().int().min(1).optional(),
  perUserLimit: z.coerce.number().int().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  active: z.coerce.boolean().default(true),
});

export const createPromoCodeSchema = promoCodeFieldsSchema.refine(
  (d) => d.discountPercent != null || d.discountAmount != null,
  { message: "discountPercent or discountAmount is required", path: ["discountPercent"] },
);

export const patchPromoCodeSchema = promoCodeFieldsSchema.partial().refine(
  (d) =>
    d.discountPercent != null ||
    d.discountAmount != null ||
    Object.keys(d).length > 0,
  { message: "Nothing to update" },
);
