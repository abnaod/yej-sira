/** Placeholder + short tips for the long-form description (Phase 1 UX). Keys = category slugs from seed. */
export const categoryDescriptionHints: Record<
  string,
  { placeholder: string; tip: string }
> = {
  "jewelry-accessories": {
    placeholder:
      "Describe materials, dimensions, closure type, and how the piece was made…",
    tip: "Buyers look for metal type, gemstone details, and care instructions.",
  },
  "home-living": {
    placeholder: "Describe materials, size, care, and what room it suits best…",
    tip: "Include dimensions and whether the item is handmade or assembled.",
  },
  "art-collectibles": {
    placeholder: "Describe the medium, size, framing, and authenticity or edition…",
    tip: "Mention year, signature, and how it will be shipped.",
  },
  "paper-party": {
    placeholder: "Describe paper weight, finish, customization options, and quantity…",
    tip: "Note production time and whether proofs are included.",
  },
  vintage: {
    placeholder: "Describe era, condition, flaws, and any provenance you can share…",
    tip: "Honest wear notes build trust with collectors.",
  },
  clothing: {
    placeholder: "Describe fit, fabric, care, and sizing notes…",
    tip: "Include measurements if sizes vary from standard retail.",
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
