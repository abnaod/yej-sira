import { z } from "zod";

/** Lowercase slug segments separated by hyphens (e.g. gift-ready, editors-pick). */
const tagSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalTagSlugs = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (Array.isArray(val)) {
      return val
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof val === "string") {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return undefined;
  },
  z.array(z.string().regex(tagSlugPattern)).max(8).optional(),
);

const optionalSearchQ = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    return typeof val === "string" ? val.trim() : val;
  },
  z.string().min(2).max(80).optional(),
);

export const listingListQuerySchema = z
  .object({
    categorySlug: z.string().optional(),
    q: optionalSearchQ,
    /** Comma-separated or repeated query keys; AND semantics (listing must have every tag). */
    tagSlugs: optionalTagSlugs,
    /** Filter to listings enrolled in this promotion while it is active. */
    promotionSlug: z.string().trim().min(1).max(80).optional(),
    /** Facet: definition key within category (requires categorySlug + allowedValueKey). */
    attributeDefinitionKey: z.string().trim().min(1).max(80).optional(),
    allowedValueKey: z.string().trim().min(1).max(80).optional(),
    sort: z.enum(["relevancy", "price-asc", "price-desc", "newest"]).default("relevancy"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(24),
  })
  .refine(
    (d) =>
      !(
        (d.attributeDefinitionKey != null || d.allowedValueKey != null) &&
        (d.attributeDefinitionKey == null || d.allowedValueKey == null || !d.categorySlug)
      ),
    {
      message:
        "attributeDefinitionKey and allowedValueKey require each other and categorySlug",
    },
  );

export const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const listingSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
