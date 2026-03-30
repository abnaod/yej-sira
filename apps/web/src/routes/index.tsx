import { createFileRoute } from "@tanstack/react-router";

import { StorefrontPage } from "@/features/storefront/storefront.page";

export const Route = createFileRoute("/")({
  component: StorefrontPage,
});
