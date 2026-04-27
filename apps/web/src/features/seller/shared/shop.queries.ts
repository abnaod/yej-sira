import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type ShopSocialLinks = {
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  telegram?: string;
  whatsapp?: string;
};

export type BusinessType = "individual" | "business";
export type PayoutMethod = "bank" | "telebirr" | "cbe";

export type MyShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  accentColor: string | null;
  status: "pending" | "active" | "rejected" | "suspended";
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: ShopSocialLinks | null;
  shippingPolicy: string | null;
  returnsPolicy: string | null;
  businessType: BusinessType | null;
  businessLegalName: string | null;
  businessTaxId: string | null;
  businessCity: string | null;
  businessSubcity: string | null;
  businessWoreda: string | null;
  businessKebele: string | null;
  businessHouseNumber: string | null;
  businessSpecificLocation: string | null;
  listingsLimit: number;
  payoutMethod: PayoutMethod | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  payoutBankCode: string | null;
  acceptedSellerPolicyAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyShopResponse = { shop: MyShop };

export const myShopQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["shops", "me", locale] as const,
    queryFn: (): Promise<MyShopResponse | { shop: null }> =>
      apiFetchJson<MyShopResponse | { shop: null }>("/api/shops/me", { locale }),
  });

export type OnboardingStep = {
  id: "profile" | "policies" | "payout" | "firstListing" | "acceptedSellerPolicy";
  done: boolean;
  label: string;
};

export type ShopOnboardingResponse = {
  shop: MyShop | null;
  steps: OnboardingStep[];
  canPublish: boolean;
  status?: MyShop["status"];
};

export const shopOnboardingQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["shops", "me", "onboarding", locale] as const,
    queryFn: (): Promise<ShopOnboardingResponse> =>
      apiFetchJson<ShopOnboardingResponse>("/api/shops/me/onboarding", { locale }),
  });

export type CreateShopBody = {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  accentColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: ShopSocialLinks;
  shippingPolicy?: string;
  returnsPolicy?: string;
  businessType?: BusinessType;
  businessLegalName?: string;
  businessTaxId?: string;
  businessCity?: string;
  businessSubcity?: string;
  businessWoreda?: string;
  businessKebele?: string;
  businessHouseNumber?: string;
  businessSpecificLocation?: string;
  acceptedSellerPolicy?: boolean;
};

export type UpdateShopBody = Partial<Omit<CreateShopBody, "slug" | "bannerImageUrl" | "accentColor">> & {
  /** Pass `null` to clear the banner image. */
  bannerImageUrl?: string | null;
  /** Pass `null` to reset the accent color to the platform default. */
  accentColor?: string | null;
  payoutMethod?: PayoutMethod;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  payoutBankCode?: string;
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

export function updateShopMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["shops", "me", "update", locale] as const,
    mutationFn: (body: UpdateShopBody) =>
      apiFetchJson<{ shop: MyShop }>("/api/shops/me", {
        method: "PATCH",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", locale] });
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", "onboarding", locale] });
    },
  });
}

export function publishShopMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["shops", "me", "publish", locale] as const,
    mutationFn: () =>
      apiFetchJson<{ shop: MyShop }>("/api/shops/me/publish", {
        method: "POST",
        locale,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", locale] });
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", "onboarding", locale] });
    },
  });
}
