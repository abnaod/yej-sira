import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthDialog } from "@/components/auth";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";

import {
  addFavoriteMutationOptions,
  favoritesQuery,
  removeFavoriteMutationOptions,
} from "./favorites.queries";

export function useProductFavoriteRow(slug: string) {
  const locale = useLocale();
  const { data: session } = authClient.useSession();
  const { openAuth } = useAuthDialog();
  const queryClient = useQueryClient();
  const addFavorite = useMutation(addFavoriteMutationOptions(queryClient, locale));
  const removeFavorite = useMutation(removeFavoriteMutationOptions(queryClient, locale));

  const { data: favoritesData } = useQuery(favoritesQuery(locale, !!session?.user));

  const isFavorite = Boolean(
    session?.user && favoritesData?.slugs.includes(slug),
  );

  const onToggleWishlist = () => {
    if (!session?.user) {
      openAuth();
      return;
    }
    if (isFavorite) {
      removeFavorite.mutate(slug);
    } else {
      addFavorite.mutate(slug);
    }
  };

  const pending = addFavorite.isPending || removeFavorite.isPending;

  return { isFavorite, onToggleWishlist, pending };
}
