/** Placeholder + short tips for the long-form description (Phase 1 UX). Keys = category slugs from seed. */
export const categoryDescriptionHints: Record<
  string,
  { placeholder: string; tip: string }
> = {
  crochet: {
    placeholder: "Describe fiber, hook size or gauge, dimensions, and whether it is made to order…",
    tip: "Note yarn brand or weight and washing instructions.",
  },
  jewelry: {
    placeholder:
      "Describe materials, dimensions, closure type, and how the piece was made…",
    tip: "Buyers look for metal type, gemstone details, and care instructions.",
  },
  basketry: {
    placeholder: "Describe fibers or materials, weave style, dimensions, and intended use…",
    tip: "Mention whether the piece is stiffened, dyed, or natural.",
  },
  pottery: {
    placeholder: "Describe clay body, glaze, firing, food safety, and dimensions…",
    tip: "Call out microwave/dishwasher safety if you have tested it.",
  },
  clothing: {
    placeholder: "Describe fit, fabric, care, and sizing notes…",
    tip: "Include measurements if sizes vary from standard retail.",
  },
  "art-collectibles": {
    placeholder: "Describe the medium, size, framing, and authenticity or edition…",
    tip: "Mention year, signature, and how it will be shipped.",
  },
};

export function getCategoryDescriptionHints(categorySlug: string | undefined): {
  placeholder: string;
  tip: string;
} {
  if (!categorySlug) {
    return {
      placeholder: "Tell your story: what makes this item special?",
      tip: "A clear description helps buyers feel confident.",
    };
  }
  return (
    categoryDescriptionHints[categorySlug] ?? {
      placeholder: "Tell your story: what makes this item special?",
      tip: "A clear description helps buyers feel confident.",
    }
  );
}
