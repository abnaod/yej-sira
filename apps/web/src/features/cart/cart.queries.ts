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

export const cartQuery = () =>
  queryOptions({
    queryKey: ["cart"] as const,
    queryFn: () => apiFetchJson<CartResponse>("/api/cart"),
  });

function invalidateCart(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["cart"] });
}

export type AddToCartInput = { variantId: string; quantity: number };

export function addToCartMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["cart", "addItem"] as const,
    mutationFn: async (input: AddToCartInput) => {
      await apiFetchJson("/api/cart/items", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function updateCartItemMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["cart", "updateItem"] as const,
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
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not update");
      }
    },
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function removeCartItemMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["cart", "removeItem"] as const,
    mutationFn: async (itemId: string) => {
      const res = await apiFetch(`/api/cart/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Could not remove");
      }
    },
    onSuccess: () => invalidateCart(queryClient),
  });
}
