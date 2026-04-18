import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type SellerListingVariantSummary = {
  id: string;
  label: string;
  stock: number;
};

export type SellerListingListItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  isPublished: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  imageUrl: string;
  stock: number;
  variantCount: number;
  outOfStockVariants: number;
  variants: SellerListingVariantSummary[];
  category: { slug: string; name: string };
  updatedAt: string;
};

export type SellerListingStockStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";

export type SellerListingsResponse = {
  listings: SellerListingListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stockCounts: Record<Exclude<SellerListingStockStatus, never>, number>;
  lowStockThreshold: number;
};

export type SellerListingsQueryParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  stockStatus?: SellerListingStockStatus;
};

export const sellerListingsQuery = (locale: Locale, params: SellerListingsQueryParams = {}) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  if (params.stockStatus && params.stockStatus !== "all") {
    search.set("stockStatus", params.stockStatus);
  }
  const qs = search.toString();
  return queryOptions({
    queryKey: ["seller", "listings", locale, params] as const,
    queryFn: () =>
      apiFetchJson<SellerListingsResponse>(`/api/seller/listings${qs ? `?${qs}` : ""}`, {
        locale,
      }),
  });
};

export type SellerAttributeInput = {
  key: string;
  allowedValueKey?: string;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
};

export type CategoryAttributeDefinitionDto = {
  key: string;
  inputType: "select" | "text" | "number" | "boolean";
  sortOrder: number;
  isRequired: boolean;
  label: string;
  options?: { key: string; label: string }[];
};

export type SellerListingDetailResponse = {
  listing: {
    id: string;
    slug: string;
    name: string;
    description: string;
    isPublished: boolean;
    featured: boolean;
    rating: number;
    reviewCount: number;
    categoryId: string;
    categorySlug: string;
    category: { id: string; slug: string; name: string };
    shop: { slug: string; name: string; imageUrl: string | null };
    storefrontAttributes: { key: string; label: string; displayValue: string }[];
    promotion?: { slug: string; badgeLabel: string; endsAt: string };
    images: string[];
    variants: {
      id: string;
      sku: string | null;
      label: string;
      colorHex: string | null;
      price: number;
      compareAtPrice?: number;
      stock: number;
    }[];
    priceFrom: number;
    tags: string[];
    attributes: SellerAttributeInput[];
  };
};

export const sellerListingDetailQuery = (locale: Locale, listingId: string) =>
  queryOptions({
    queryKey: ["seller", "listing", locale, listingId] as const,
    queryFn: () =>
      apiFetchJson<SellerListingDetailResponse>(
        `/api/seller/listings/${encodeURIComponent(listingId)}`,
        { locale },
      ),
  });

export const categoryAttributeDefinitionsQuery = (locale: Locale, categorySlug: string) =>
  queryOptions({
    queryKey: ["catalog", "categoryAttributes", locale, categorySlug] as const,
    queryFn: () =>
      apiFetchJson<{ definitions: CategoryAttributeDefinitionDto[] }>(
        `/api/categories/${encodeURIComponent(categorySlug)}/attributes`,
        { locale },
      ),
    enabled: Boolean(categorySlug),
  });

export type CreateSellerListingBody = {
  categorySlug?: string;
  categoryId?: string;
  name: string;
  description: string;
  slug: string;
  featured?: boolean;
  isPublished?: boolean;
  images: string[];
  tagSlugs?: string[];
  variants: {
    sku?: string;
    label: string;
    colorHex?: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    labelAm?: string;
  }[];
  translationAm?: { name: string; description: string };
  attributes?: SellerAttributeInput[];
};

export function createSellerListingMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["seller", "create", locale] as const,
    mutationFn: (body: CreateSellerListingBody) =>
      apiFetchJson<{ listing: { id: string; slug: string } }>("/api/seller/listings", {
        method: "POST",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "listings", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
    },
  });
}

export type PatchSellerListingBody = Partial<{
  categorySlug: string;
  categoryId: string;
  name: string;
  description: string;
  slug: string;
  featured: boolean;
  isPublished: boolean;
  images: string[];
  tagSlugs: string[];
  variants: {
    sku?: string;
    label: string;
    colorHex?: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    labelAm?: string;
  }[];
  translationAm: { name: string; description: string } | null;
  attributes: SellerAttributeInput[];
}>;

export function updateSellerListingMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  listingId: string,
) {
  return mutationOptions({
    mutationKey: ["seller", "patch", locale, listingId] as const,
    mutationFn: (body: PatchSellerListingBody) =>
      apiFetchJson<{ ok: boolean }>(`/api/seller/listings/${encodeURIComponent(listingId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "listings", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
      void queryClient.invalidateQueries({
        queryKey: ["seller", "listing", locale, listingId],
      });
    },
  });
}

export function deleteSellerListingMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["seller", "delete", locale] as const,
    mutationFn: (listingId: string) =>
      apiFetchJson<{ ok: boolean }>(`/api/seller/listings/${encodeURIComponent(listingId)}`, {
        method: "DELETE",
        locale,
      }),
    onSuccess: (_data, listingId) => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "listings", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
      void queryClient.invalidateQueries({
        queryKey: ["seller", "listing", locale, listingId],
      });
    },
  });
}

export type SellerListingStockUpdateBody = {
  variants: { id: string; stock: number }[];
};

export function updateSellerListingStockMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  listingId: string,
) {
  return mutationOptions({
    mutationKey: ["seller", "stock", locale, listingId] as const,
    mutationFn: (body: SellerListingStockUpdateBody) =>
      apiFetchJson<{ ok: boolean; updated: number }>(
        `/api/seller/listings/${encodeURIComponent(listingId)}/stock`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
          locale,
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "listings", locale] });
      void queryClient.invalidateQueries({
        queryKey: ["seller", "listing", locale, listingId],
      });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
    },
  });
}

export function publishSellerListingMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["seller", "publish", locale] as const,
    mutationFn: (listingId: string) =>
      apiFetchJson<{ ok: boolean }>(`/api/seller/listings/${encodeURIComponent(listingId)}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: true }),
        locale,
      }),
    onSuccess: (_data, listingId) => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "listings", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
      void queryClient.invalidateQueries({
        queryKey: ["seller", "listing", locale, listingId],
      });
    },
  });
}
