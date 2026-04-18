import type { Locale } from "@ys/intl";
import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";

import type { ListingCardDto } from "@/features/store/home/home.queries";
import { apiFetchJson } from "@/lib/api";

export type FavoritesResponse = {
  listings: ListingCardDto[];
  slugs: string[];
};

export function favoritesQuery(locale: Locale, enabled: boolean) {
  return queryOptions({
    queryKey: ["favorites", locale] as const,
    queryFn: () => apiFetchJson<FavoritesResponse>("/api/favorites", { locale }),
    enabled,
  });
}

function invalidateFavorites(queryClient: QueryClient, locale: Locale) {
  void queryClient.invalidateQueries({ queryKey: ["favorites", locale] });
}

export function addFavoriteMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["favorites", "add", locale] as const,
    mutationFn: async (slug: string) => {
      await apiFetchJson("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ slug }),
        locale,
      });
    },
    onSuccess: () => invalidateFavorites(queryClient, locale),
  });
}

export function removeFavoriteMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["favorites", "remove", locale] as const,
    mutationFn: async (slug: string) => {
      await apiFetchJson(`/api/favorites/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        locale,
      });
    },
    onSuccess: () => invalidateFavorites(queryClient, locale),
  });
}
