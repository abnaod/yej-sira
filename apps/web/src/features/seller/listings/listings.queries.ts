import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

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
  category: { slug: string; name: string };
  updatedAt: string;
};

export type SellerListingsResponse = { listings: SellerListingListItem[] };

export const sellerListingsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["seller", "listings", locale] as const,
    queryFn: () => apiFetchJson<SellerListingsResponse>("/api/seller/listings", { locale }),
  });

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
