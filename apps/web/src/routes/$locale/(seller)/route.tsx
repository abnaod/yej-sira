import { createFileRoute } from "@tanstack/react-router";

import { ShopLayout } from "@/components/shells/shop-layout";

export const Route = createFileRoute("/$locale/(seller)")({
  component: ShopLayout,
});
