import { createFileRoute } from "@tanstack/react-router";

import { ShopPage } from "@/features/shop/shop.page";

export const Route = createFileRoute("/$locale/(store)/shops/$shopSlug")({
  component: ShopPage,
});
