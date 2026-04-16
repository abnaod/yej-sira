import type { Locale } from "@ys/intl";
import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

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
  /** Server-configured standard delivery fee (from `STANDARD_DELIVERY_FEE_ETB`). */
  standardDeliveryFeeEtb: number;
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

/** `listingName` is optional UI-only copy for toasts; it is not sent to the API. */
export type AddToCartInput = {
  variantId: string;
  quantity: number;
  listingName?: string;
};

export function addToCartMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["cart", "addItem", locale] as const,
    mutationFn: async (input: AddToCartInput) => {
      const { variantId, quantity } = input;
      await apiFetchJson("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity }),
        locale,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateCart(queryClient, locale);
      const label = variables.listingName?.trim();
      toast.success(label ? `${label} added to cart` : "Added to cart");
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Could not add to cart";
      toast.error(message);
    },
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

export type PromoResponse = {
  valid: boolean;
  code: string;
  discount: number;
  discountLabel: string;
};

export function applyPromoMutationOptions(
  _queryClient: QueryClient,
  locale: Locale,
  callbacks: {
    onSuccess?: (data: PromoResponse) => void;
    onError?: (err: Error) => void;
  } = {},
) {
  return mutationOptions({
    mutationKey: ["cart", "promo", locale] as const,
    mutationFn: async (code: string): Promise<PromoResponse> => {
      return apiFetchJson<PromoResponse>("/api/cart/promo", {
        method: "POST",
        body: JSON.stringify({ code }),
        locale,
      });
    },
    onSuccess: (data) => {
      callbacks.onSuccess?.(data);
    },
    onError: (err) => {
      callbacks.onError?.(err as Error);
    },
  });
}
