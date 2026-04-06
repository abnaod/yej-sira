import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type SellerProductListItem = {
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

export type SellerProductsResponse = { products: SellerProductListItem[] };

export const sellerProductsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["seller", "products", locale] as const,
    queryFn: () => apiFetchJson<SellerProductsResponse>("/api/seller/products", { locale }),
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

export type SellerProductDetailResponse = {
  product: {
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

export const sellerProductDetailQuery = (locale: Locale, productId: string) =>
  queryOptions({
    queryKey: ["seller", "product", locale, productId] as const,
    queryFn: () =>
      apiFetchJson<SellerProductDetailResponse>(
        `/api/seller/products/${encodeURIComponent(productId)}`,
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

export type CreateSellerProductBody = {
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

export function createSellerProductMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["seller", "create", locale] as const,
    mutationFn: (body: CreateSellerProductBody) =>
      apiFetchJson<{ product: { id: string; slug: string } }>("/api/seller/products", {
        method: "POST",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "products", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
    },
  });
}

export type PatchSellerProductBody = Partial<{
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

export function updateSellerProductMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  productId: string,
) {
  return mutationOptions({
    mutationKey: ["seller", "patch", locale, productId] as const,
    mutationFn: (body: PatchSellerProductBody) =>
      apiFetchJson<{ ok: boolean }>(`/api/seller/products/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "products", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
      void queryClient.invalidateQueries({
        queryKey: ["seller", "product", locale, productId],
      });
    },
  });
}

export function deleteSellerProductMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  productId: string,
) {
  return mutationOptions({
    mutationKey: ["seller", "delete", locale, productId] as const,
    mutationFn: () =>
      apiFetchJson<{ ok: boolean }>(`/api/seller/products/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller", "products", locale] });
      void queryClient.invalidateQueries({ queryKey: ["seller", "dashboard", locale] });
    },
  });
}
