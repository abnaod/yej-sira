import { z } from "zod";

import { isReservedShopSlug } from "../../lib/env";

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
  .refine((slug) => !isReservedShopSlug(slug), "Slug is reserved");

/** Accept absolute URLs or local `/static/*` paths served by the API. */
const imageRefSchema = z.union([
  z.string().url(),
  z
    .string()
    .regex(/^\/static\/[A-Za-z0-9._\-/]+$/, {
      message: "Must be an absolute URL or a /static/... path",
    }),
]);

/** Optional public/social URLs for the shop profile (stored as JSON). */
export const socialLinksSchema = z
  .object({
    website: z.string().url().optional(),
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    /** Full Telegram URL, e.g. `https://t.me/yourshop`. */
    telegram: z.string().url().optional(),
    /** Full WhatsApp URL, e.g. `https://wa.me/2519XXXXXXX`. */
    whatsapp: z.string().url().optional(),
  })
  .strict()
  .optional();

/** 3-, 4-, 6-, or 8-digit hex color (case-insensitive), with leading `#`. */
const accentColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, {
    message: "Must be a hex color like #1f6feb",
  });

export const createShopBodySchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
  imageUrl: imageRefSchema.optional(),
  bannerImageUrl: imageRefSchema.optional(),
  accentColor: accentColorSchema.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  socialLinks: socialLinksSchema,
  shippingPolicy: z.string().max(20000).optional(),
  returnsPolicy: z.string().max(20000).optional(),
  businessType: z.enum(["individual", "business"]).optional(),
  businessLegalName: z.string().max(200).optional(),
  businessTaxId: z.string().max(80).optional(),
  businessCity: z.string().max(120).optional(),
  businessSubcity: z.string().max(120).optional(),
  businessWoreda: z.string().max(120).optional(),
  businessKebele: z.string().max(120).optional(),
  businessHouseNumber: z.string().max(80).optional(),
  businessSpecificLocation: z.string().max(500).optional(),
  acceptedSellerPolicy: z.boolean().optional(),
});

export const updateShopBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: imageRefSchema.optional(),
  /** Pass `null` to clear the banner. */
  bannerImageUrl: imageRefSchema.nullable().optional(),
  /** Pass `null` to reset to the default theme color. */
  accentColor: accentColorSchema.nullable().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  socialLinks: socialLinksSchema,
  shippingPolicy: z.string().max(20000).optional(),
  returnsPolicy: z.string().max(20000).optional(),
  businessType: z.enum(["individual", "business"]).optional(),
  businessLegalName: z.string().max(200).optional(),
  businessTaxId: z.string().max(80).optional(),
  businessCity: z.string().max(120).optional(),
  businessSubcity: z.string().max(120).optional(),
  businessWoreda: z.string().max(120).optional(),
  businessKebele: z.string().max(120).optional(),
  businessHouseNumber: z.string().max(80).optional(),
  businessSpecificLocation: z.string().max(500).optional(),
  payoutMethod: z.enum(["bank", "telebirr", "cbe"]).optional(),
  payoutAccountName: z.string().max(200).optional(),
  payoutAccountNumber: z.string().max(80).optional(),
  payoutBankCode: z.string().max(40).optional(),
  acceptedSellerPolicy: z.boolean().optional(),
});

export const publicShopListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
  sort: z.enum(["relevancy", "price-asc", "price-desc", "newest"]).default("relevancy"),
});
