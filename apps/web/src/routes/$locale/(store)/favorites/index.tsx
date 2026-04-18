import { createFileRoute } from "@tanstack/react-router";

import { FavoritesPage } from "@/features/store/favorites";

export const Route = createFileRoute("/$locale/(store)/favorites/")({
  component: FavoritesPage,
});
