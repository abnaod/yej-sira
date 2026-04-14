import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchJson } from "@/lib/api";

export type ShopSocialLinks = {
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
};

export type MyShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: "pending" | "active" | "rejected" | "suspended";
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: ShopSocialLinks | null;
  shippingPolicy: string | null;
  returnsPolicy: string | null;
  businessLegalName: string | null;
  businessTaxId: string | null;
  businessAddressLine1: string | null;
  businessAddressLine2: string | null;
  businessCity: string | null;
  businessPostalCode: string | null;
  businessCountry: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyShopResponse = { shop: MyShop };

export const myShopQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["shops", "me", locale] as const,
    queryFn: async (): Promise<MyShopResponse | { shop: null }> => {
      const res = await apiFetch("/api/shops/me", { locale });
      if (res.status === 404) return { shop: null };
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return (await res.json()) as MyShopResponse;
    },
  });

export type CreateShopBody = {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: ShopSocialLinks;
  shippingPolicy?: string;
  returnsPolicy?: string;
  businessLegalName?: string;
  businessTaxId?: string;
  businessAddressLine1?: string;
  businessAddressLine2?: string;
  businessCity?: string;
  businessPostalCode?: string;
  businessCountry?: string;
};

export function createShopMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["shops", "create", locale] as const,
    mutationFn: (body: CreateShopBody) =>
      apiFetchJson<{ shop: MyShop }>("/api/shops", {
        method: "POST",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", locale] });
      void queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}
