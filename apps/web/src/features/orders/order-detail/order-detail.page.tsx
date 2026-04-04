import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { orderDetailQuery } from "../orders.queries";

const routeApi = getRouteApi("/orders/$orderId");

export function OrderDetailPage() {
  const { orderId } = routeApi.useParams();

  const { data } = useSuspenseQuery(orderDetailQuery(orderId));

  const { order } = data;

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
      <p className="mt-2 text-neutral-600">
        Placed {new Date(order.createdAt).toLocaleString()} · {order.status}
      </p>

      <div className="mt-6 rounded-lg border border-border bg-white p-4 text-sm">
        <p className="font-semibold">Ship to</p>
        <p className="mt-1 text-muted-foreground">
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
        </p>
        <p className="mt-4 font-semibold">
          Total: ${order.total.toFixed(2)} (incl. tax ${order.tax.toFixed(2)})
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-lg border border-border bg-white p-3"
          >
            <img
              src={item.imageUrl}
              alt=""
              className="h-16 w-16 rounded-md object-contain"
            />
            <div>
              <p className="font-medium">{item.productName}</p>
              {item.variantLabel && (
                <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {item.quantity} × ${item.unitPrice.toFixed(2)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
