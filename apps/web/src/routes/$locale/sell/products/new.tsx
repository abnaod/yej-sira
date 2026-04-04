import { createFileRoute } from "@tanstack/react-router";

import { SellerProductNewPage } from "@/features/seller/seller-product-editor.page";

export const Route = createFileRoute("/$locale/sell/products/new")({
  component: SellerProductNewPage,
});
