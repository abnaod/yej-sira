import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthDialog } from "@/components/auth";
import { authClient } from "@/lib/auth-client";

import {
  addFavoriteMutationOptions,
  favoritesQuery,
  removeFavoriteMutationOptions,
} from "./favorites.queries";

export function useProductFavoriteRow(slug: string) {
  const { data: session } = authClient.useSession();
  const { openAuth } = useAuthDialog();
  const queryClient = useQueryClient();
  const addFavorite = useMutation(addFavoriteMutationOptions(queryClient));
  const removeFavorite = useMutation(removeFavoriteMutationOptions(queryClient));

  const { data: favoritesData } = useQuery(favoritesQuery(!!session?.user));

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
