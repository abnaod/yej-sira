import type { Locale } from "@ys/intl";
import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import type {
  ProductCardDto,
  ProductPromotionDto,
} from "@/features/storefront/storefront.queries";
import { apiFetchJson } from "@/lib/api";

export type ProductDetailResponse = {
  product: {
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
    promotion?: ProductPromotionDto;
    attributes: { key: string; label: string; displayValue: string }[];
  };
};

export const productDetailQuery = (locale: Locale, productSlug: string) =>
  queryOptions({
    queryKey: ["product", locale, productSlug] as const,
    queryFn: () =>
      apiFetchJson<ProductDetailResponse>(
        `/api/products/${encodeURIComponent(productSlug)}`,
        { locale },
      ),
  });

export type RelatedProductsResponse = {
  products: ProductCardDto[];
};

export const relatedProductsQuery = (locale: Locale, productSlug: string) =>
  queryOptions({
    queryKey: ["product", locale, productSlug, "related"] as const,
    queryFn: () =>
      apiFetchJson<RelatedProductsResponse>(
        `/api/products/${encodeURIComponent(productSlug)}/related`,
        { locale },
      ),
  });

export const moreFromShopProductsQuery = (locale: Locale, productSlug: string) =>
  queryOptions({
    queryKey: ["product", locale, productSlug, "more-from-shop"] as const,
    queryFn: () =>
      apiFetchJson<RelatedProductsResponse>(
        `/api/products/${encodeURIComponent(productSlug)}/more-from-shop`,
        { locale },
      ),
  });

export type ProductReviewDto = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
};

export type ViewerProductReviewDto = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
};

export type ProductReviewsResponse = {
  reviews: ProductReviewDto[];
  nextCursor: string | null;
  /** Present when the request includes a signed-in user who has reviewed this product. */
  viewerReview: ViewerProductReviewDto | null;
};

export const productReviewsQuery = (locale: Locale, productSlug: string) =>
  queryOptions({
    queryKey: ["product", locale, productSlug, "reviews"] as const,
    queryFn: () =>
      apiFetchJson<ProductReviewsResponse>(
        `/api/products/${encodeURIComponent(productSlug)}/reviews`,
        { locale },
      ),
  });

export type SubmitProductReviewResponse = {
  review: ProductReviewDto;
  product: { rating: number; reviewCount: number };
};

export function submitProductReviewMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  productSlug: string,
) {
  return mutationOptions({
    mutationKey: ["product", "review", locale, productSlug] as const,
    mutationFn: (input: { stars: number; comment: string }) =>
      apiFetchJson<SubmitProductReviewResponse>(
        `/api/products/${encodeURIComponent(productSlug)}/reviews`,
        {
          method: "POST",
          body: JSON.stringify(input),
          locale,
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["product", locale, productSlug],
      });
    },
  });
}

export function deleteProductReviewMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  productSlug: string,
) {
  return mutationOptions({
    mutationKey: ["product", "review", "delete", locale, productSlug] as const,
    mutationFn: () =>
      apiFetchJson<{ ok: boolean }>(
        `/api/products/${encodeURIComponent(productSlug)}/reviews`,
        { method: "DELETE", locale },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["product", locale, productSlug],
      });
    },
  });
}
