import type { Locale } from "@ys/intl";
import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import type {
  ListingCardDto,
  ListingPromotionDto,
} from "@/features/storefront/storefront.queries";
import { apiFetchJson } from "@/lib/api";

export type ListingDetailResponse = {
  listing: {
    id: string;
    slug: string;
    name: string;
    description: string;
    rating: number;
    reviewCount: number;
    category: { id: string; slug: string; name: string };
    shop: { slug: string; name: string; imageUrl: string | null };
    tags: { slug: string; name: string }[];
    images: string[];
    variants: {
      id: string;
      label: string;
      colorHex: string | null;
      price: number;
      compareAtPrice?: number;
      stock: number;
    }[];
    priceFrom: number;
    promotion?: ListingPromotionDto;
    attributes: { key: string; label: string; displayValue: string }[];
  };
};

export const listingDetailQuery = (locale: Locale, listingSlug: string) =>
  queryOptions({
    queryKey: ["listing", locale, listingSlug] as const,
    queryFn: () =>
      apiFetchJson<ListingDetailResponse>(
        `/api/listings/${encodeURIComponent(listingSlug)}`,
        { locale },
      ),
  });

export type RelatedListingsResponse = {
  listings: ListingCardDto[];
};

export const relatedListingsQuery = (locale: Locale, listingSlug: string) =>
  queryOptions({
    queryKey: ["listing", locale, listingSlug, "related"] as const,
    queryFn: () =>
      apiFetchJson<RelatedListingsResponse>(
        `/api/listings/${encodeURIComponent(listingSlug)}/related`,
        { locale },
      ),
  });

export const moreFromShopListingsQuery = (locale: Locale, listingSlug: string) =>
  queryOptions({
    queryKey: ["listing", locale, listingSlug, "more-from-shop"] as const,
    queryFn: () =>
      apiFetchJson<RelatedListingsResponse>(
        `/api/listings/${encodeURIComponent(listingSlug)}/more-from-shop`,
        { locale },
      ),
  });

export type ListingReviewDto = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
};

export type ViewerListingReviewDto = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
};

/** Index `i` = `i + 1` stars (e.g. `[0]` = 1-star count). */
export type ListingRatingSummaryCounts = [
  number,
  number,
  number,
  number,
  number,
];

export type ListingRatingSummary = {
  average: number;
  total: number;
  counts: ListingRatingSummaryCounts;
};

export type ListingReviewsResponse = {
  reviews: ListingReviewDto[];
  nextCursor: string | null;
  /** Present when the request includes a signed-in user who has reviewed this listing. */
  viewerReview: ViewerListingReviewDto | null;
  summary: ListingRatingSummary;
};

export const listingReviewsQuery = (locale: Locale, listingSlug: string) =>
  queryOptions({
    queryKey: ["listing", locale, listingSlug, "reviews"] as const,
    queryFn: () =>
      apiFetchJson<ListingReviewsResponse>(
        `/api/listings/${encodeURIComponent(listingSlug)}/reviews`,
        { locale },
      ),
  });

export type SubmitListingReviewResponse = {
  review: ListingReviewDto;
  listing: { rating: number; reviewCount: number };
};

export function submitListingReviewMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  listingSlug: string,
) {
  return mutationOptions({
    mutationKey: ["listing", "review", locale, listingSlug] as const,
    mutationFn: (input: { stars: number; comment: string }) =>
      apiFetchJson<SubmitListingReviewResponse>(
        `/api/listings/${encodeURIComponent(listingSlug)}/reviews`,
        {
          method: "POST",
          body: JSON.stringify(input),
          locale,
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["listing", locale, listingSlug],
      });
    },
  });
}

export function deleteListingReviewMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  listingSlug: string,
) {
  return mutationOptions({
    mutationKey: ["listing", "review", "delete", locale, listingSlug] as const,
    mutationFn: () =>
      apiFetchJson<{ ok: boolean }>(
        `/api/listings/${encodeURIComponent(listingSlug)}/reviews`,
        { method: "DELETE", locale },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["listing", locale, listingSlug],
      });
    },
  });
}
