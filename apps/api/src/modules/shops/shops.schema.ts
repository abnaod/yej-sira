import { z } from "zod";

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case");

/** Optional public/social URLs for the shop profile (stored as JSON). */
export const socialLinksSchema = z
  .object({
    website: z.string().url().optional(),
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    tiktok: z.string().url().optional(),
  })
  .strict()
  .optional();

export const createShopBodySchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  socialLinks: socialLinksSchema,
  shippingPolicy: z.string().max(20000).optional(),
  returnsPolicy: z.string().max(20000).optional(),
  businessLegalName: z.string().max(200).optional(),
  businessTaxId: z.string().max(80).optional(),
  businessAddressLine1: z.string().max(200).optional(),
  businessAddressLine2: z.string().max(200).optional(),
  businessCity: z.string().max(120).optional(),
  businessPostalCode: z.string().max(40).optional(),
  businessCountry: z.string().max(120).optional(),
});

export const publicShopProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
});
