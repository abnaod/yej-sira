import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/orders/$orderId");

export function OrderDetailPage() {
  const { orderId } = routeApi.useParams();

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
      <p className="mt-2 text-neutral-600">Order ID: {orderId}</p>
    </main>
  );
}
