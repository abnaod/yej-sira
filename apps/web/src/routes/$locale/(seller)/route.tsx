import { createFileRoute } from "@tanstack/react-router";

import { SellerLayout } from "@/components/layouts/seller-layout";

export const Route = createFileRoute("/$locale/(seller)")({
  component: SellerLayout,
});
