import type { Locale } from "@ys/intl";
import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import { apiFetch, apiFetchJson } from "@/lib/api";

export type CartResponse = {
  cartId: string;
  anonymousToken?: string | null;
  items: {
    id: string;
    variantId: string;
    name: string;
    variant?: string;
    price: number;
    quantity: number;
    imageUrl: string;
    stock: number;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export const cartQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["cart", locale] as const,
    queryFn: () => apiFetchJson<CartResponse>("/api/cart", { locale }),
  });

function invalidateCart(queryClient: QueryClient, locale: Locale) {
  void queryClient.invalidateQueries({ queryKey: ["cart", locale] });
}

export type AddToCartInput = { variantId: string; quantity: number };

export function addToCartMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["cart", "addItem", locale] as const,
    mutationFn: async (input: AddToCartInput) => {
      await apiFetchJson("/api/cart/items", {
        method: "POST",
        body: JSON.stringify(input),
        locale,
      });
    },
    onSuccess: () => invalidateCart(queryClient, locale),
  });
}

export function updateCartItemMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["cart", "updateItem", locale] as const,
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      const res = await apiFetch(`/api/cart/items/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
        locale,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not update");
      }
    },
    onSuccess: () => invalidateCart(queryClient, locale),
  });
}

export function removeCartItemMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["cart", "removeItem", locale] as const,
    mutationFn: async (itemId: string) => {
      const res = await apiFetch(`/api/cart/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        locale,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not remove");
      }
    },
    onSuccess: () => invalidateCart(queryClient, locale),
  });
}
