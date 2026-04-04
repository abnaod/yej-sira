import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

import type {
  ProductCardDto,
  ProductPromotionDto,
} from "@/features/storefront/storefront.queries";

export type ProductDetailResponse = {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    rating: number;
    reviewCount: number;
    category: { id: string; slug: string; name: string };
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
  };
};

export const productDetailQuery = (productSlug: string) =>
  queryOptions({
    queryKey: ["product", productSlug] as const,
    queryFn: () =>
      apiFetchJson<ProductDetailResponse>(
        `/api/products/${encodeURIComponent(productSlug)}`,
      ),
  });

export type RelatedProductsResponse = {
  products: ProductCardDto[];
};

export const relatedProductsQuery = (productSlug: string) =>
  queryOptions({
    queryKey: ["product", productSlug, "related"] as const,
    queryFn: () =>
      apiFetchJson<RelatedProductsResponse>(
        `/api/products/${encodeURIComponent(productSlug)}/related`,
      ),
  });
