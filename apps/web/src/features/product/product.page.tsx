import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/products/$productId");

export function ProductPage() {
  const { productId } = routeApi.useParams();

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Product</h1>
      <p className="mt-2 text-neutral-600">Product ID: {productId}</p>
    </main>
  );
}
