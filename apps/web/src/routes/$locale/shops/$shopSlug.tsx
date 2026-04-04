import { createFileRoute } from "@tanstack/react-router";

import { ShopPage } from "@/features/shop/shop.page";

export const Route = createFileRoute("/$locale/shops/$shopSlug")({
  component: ShopPage,
});
