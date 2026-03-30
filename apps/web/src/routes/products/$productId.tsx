import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/features/product/product.page";

export const Route = createFileRoute("/products/$productId")({
  component: ProductPage,
});
