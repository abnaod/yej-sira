import { createFileRoute } from "@tanstack/react-router";

import { StoreLayout } from "@/components/shells/store-layout";
import { loadStorefrontTenant } from "@/lib/storefront-tenant";

export const Route = createFileRoute("/$locale/(store)")({
  loader: () => loadStorefrontTenant(),
  component: StoreLayout,
});
