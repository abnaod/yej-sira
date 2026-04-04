import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { SellerProductEditPage } from "@/features/seller/seller-product-editor.page";

const routeApi = getRouteApi("/$locale/sell/products/$productId");

function SellerProductEditRoute() {
  const { productId } = routeApi.useParams();
  return <SellerProductEditPage productId={productId} />;
}

export const Route = createFileRoute("/$locale/sell/products/$productId")({
  component: SellerProductEditRoute,
});
