import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import type { ProductCardDto } from "@/features/storefront/storefront.queries";
import { apiFetchJson } from "@/lib/api";

export type FavoritesResponse = {
  products: ProductCardDto[];
  slugs: string[];
};

export function favoritesQuery(enabled: boolean) {
  return queryOptions({
    queryKey: ["favorites"] as const,
    queryFn: () => apiFetchJson<FavoritesResponse>("/api/favorites"),
    enabled,
  });
}

function invalidateFavorites(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["favorites"] });
}

export function addFavoriteMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["favorites", "add"] as const,
    mutationFn: async (slug: string) => {
      await apiFetchJson("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ slug }),
      });
    },
    onSuccess: () => invalidateFavorites(queryClient),
  });
}

export function removeFavoriteMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["favorites", "remove"] as const,
    mutationFn: async (slug: string) => {
      await apiFetchJson(`/api/favorites/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => invalidateFavorites(queryClient),
  });
}
