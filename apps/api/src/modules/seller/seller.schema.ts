import { z } from "zod";

/**
 * Listing image references. Accepts either an absolute URL (external CDN) or a
 * local static path served by this API at `/static/*` (e.g. `/static/listings/foo.jpg`).
 */
const imageRefSchema = z.union([
  z.string().url(),
  z
    .string()
    .regex(/^\/static\/[A-Za-z0-9._\-/]+$/, {
      message: "Must be an absolute URL or a /static/... path",
    }),
]);

const listingSlugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const variantInputSchema = z.object({
  sku: z.string().max(80).optional(),
  label: z.string().min(1).max(120),
  colorHex: z.string().max(16).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).max(999999),
  labelAm: z.string().max(120).optional(),
});

const sellerAttributeInputSchema = z.object({
  key: z.string().min(1).max(80),
  allowedValueKey: z.string().min(1).max(80).optional(),
  textValue: z.string().max(5000).optional(),
  numberValue: z.number().finite().optional(),
  booleanValue: z.boolean().optional(),
});

export const sellerListingCreateSchema = z
  .object({
    categorySlug: z.string().optional(),
    categoryId: z.string().optional(),
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(20000),
    slug: listingSlugSchema,
    featured: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    images: z.array(imageRefSchema).min(1).max(20),
    tagSlugs: z.array(z.string()).max(20).optional(),
    variants: z.array(variantInputSchema).min(1).max(50),
    translationAm: z
      .object({
        name: z.string().min(1),
        description: z.string().min(1),
      })
      .optional(),
    attributes: z.array(sellerAttributeInputSchema).max(40).optional(),
  })
  .refine((d) => Boolean(d.categorySlug ?? d.categoryId), {
    message: "Provide categorySlug or categoryId",
  });

export const sellerListingPatchSchema = z.object({
  categorySlug: z.string().optional(),
  categoryId: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(20000).optional(),
  slug: listingSlugSchema.optional(),
  featured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  images: z.array(imageRefSchema).min(1).max(20).optional(),
  tagSlugs: z.array(z.string()).max(20).optional(),
  variants: z.array(variantInputSchema.extend({ id: z.string().optional() })).min(1).max(50).optional(),
  translationAm: z
    .object({
      name: z.string().min(1),
      description: z.string().min(1),
    })
    .nullable()
    .optional(),
  attributes: z.array(sellerAttributeInputSchema).max(40).optional(),
});
