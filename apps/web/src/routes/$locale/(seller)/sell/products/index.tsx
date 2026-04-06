import { createFileRoute } from "@tanstack/react-router";

import { SellerProductsPage } from "@/features/seller/seller-products.page";

export const Route = createFileRoute("/$locale/(seller)/sell/products/")({
  component: SellerProductsPage,
});
