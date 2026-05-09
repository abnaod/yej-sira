import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { ListingPage } from "@/features/store/listings";
import {
  moreFromShopListingsQuery,
  listingDetailQuery,
  listingReviewsQuery,
  relatedListingsQuery,
  type ListingDetailResponse,
} from "@/features/store/listings/listings.queries";

export const Route = createFileRoute("/$locale/(store)/listings/$listingId")({
  loader: async ({ context, params }) => {
    const locale = params.locale as Locale;
    const detail = await context.queryClient.ensureQueryData(
      listingDetailQuery(locale, params.listingId),
    );
    void context.queryClient.prefetchQuery(relatedListingsQuery(locale, params.listingId));
    void context.queryClient.prefetchQuery(
      moreFromShopListingsQuery(locale, params.listingId),
    );
    void context.queryClient.prefetchQuery(listingReviewsQuery(locale, params.listingId));
    return { detail: detail as ListingDetailResponse };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.detail?.listing;
    if (!l) return { meta: [] };
    const description = (l.description ?? "").slice(0, 160);
    const image = l.images[0];

    const jsonLd = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: l.name,
      description,
      image: image ? [image] : undefined,
      brand: { "@type": "Brand", name: l.shop.name },
      sku: l.id,
      aggregateRating:
        l.reviewCount > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: l.rating,
              reviewCount: l.reviewCount,
            }
          : undefined,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "ETB",
        lowPrice: l.priceFrom,
        availability:
          l.variants.some((v) => v.stock > 0)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
    };

    return {
      meta: [
        { title: `${l.name} — ${l.shop.name}` },
        { name: "description", content: description },
        { property: "og:title", content: l.name },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        ...(image ? [{ property: "og:image", content: image }] : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </main>
  ),
  component: ListingPage,
});
