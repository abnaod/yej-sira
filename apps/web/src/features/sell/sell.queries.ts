import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetch, apiFetchJson } from "@/lib/api";

export type MyShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: "pending" | "active" | "rejected" | "suspended";
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

export type CreateShopBody = { name: string; slug: string; description?: string };

export function createShopMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["shops", "create", locale] as const,
    mutationFn: (body: CreateShopBody) =>
      apiFetchJson<{ shop: { id: string; slug: string; name: string; status: string } }>(
        "/api/shops",
        {
          method: "POST",
          body: JSON.stringify(body),
          locale,
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", locale] });
      void queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}
