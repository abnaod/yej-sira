import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { cashOnFulfillmentLabel } from "@/features/store/checkout/components/payment-method-step";
import { apiFetchJson, assetUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { OrderDetailResponse } from "./orders.queries";

type InitializePaymentResponse = {
  checkoutUrl: string;
  txRef: string;
  orderId: string;
};

async function initializePayment(
  orderId: string,
  orderAccessToken?: string | null,
): Promise<InitializePaymentResponse> {
  return apiFetchJson<InitializePaymentResponse>("/api/payments/chapa/initialize", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      ...(orderAccessToken ? { orderAccessToken } : {}),
    }),
  });
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "paid" }
> = {
  pending: { label: "Pending", variant: "outline" },
  awaiting_payment: { label: "Awaiting Payment", variant: "secondary" },
  paid: { label: "Paid", variant: "paid" },
  fulfilled: { label: "Fulfilled", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const paymentMethodLabels: Record<"chapa" | "telebirr", string> = {
  chapa: "Chapa",
  telebirr: "telebirr",
};

export type OrderDetailViewProps = {
  locale: Locale;
  order: OrderDetailResponse["order"];
  /**
   * Supplied for guest views (route: `/orders/by-token/$token`) to authorize
   * Chapa re-initialization without a session. Undefined for signed-in views.
   */
  orderAccessToken?: string;
  /**
   * Query key to invalidate after a payment-retry attempt fails so the caller
   * can refetch the order with fresh payment status.
   */
  queryKey: readonly unknown[];
  /**
   * When true, render the "Back to orders" link. Guests have no orders list,
   * so we hide it there.
   */
  showBackToOrders: boolean;
};

export function OrderDetailView({
  locale,
  order,
  orderAccessToken,
  queryKey,
  showBackToOrders,
}: OrderDetailViewProps) {
  const queryClient = useQueryClient();

  const config = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };

  const initializePaymentMutation = useMutation({
    mutationFn: (id: string) => initializePayment(id, orderAccessToken ?? null),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const canRetryPayment = order.status === "awaiting_payment";

  return (
    <main>
      {showBackToOrders && (
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="-ms-2 gap-1.5 px-2 text-muted-foreground" asChild>
            <Link to="/$locale/orders" params={{ locale }}>
              <ArrowLeft className="size-4" />
              Back to orders
            </Link>
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <p className="mt-2 text-neutral-600">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={config.variant}>{config.label}</Badge>
          {canRetryPayment && (
            <Button
              size="sm"
              disabled={initializePaymentMutation.isPending}
              onClick={() => initializePaymentMutation.mutate(order.id)}
            >
              {initializePaymentMutation.isPending ? "Redirecting..." : "Pay Now"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm">
        <p className="font-semibold">
          {order.deliveryMethod === "pickup" ? "Pick up at" : "Ship to"}
        </p>
        <p className="mt-1 text-muted-foreground">
          {order.deliveryMethod === "pickup" && order.pickupLocation ? (
            <>
              {order.pickupLocation.name}
              <br />
              {order.pickupLocation.line1}
              {order.pickupLocation.line2 ? `, ${order.pickupLocation.line2}` : ""}
              <br />
              {order.pickupLocation.city}, {order.pickupLocation.postalCode}
              <br />
              {order.pickupLocation.country}
            </>
          ) : (
            <>
              City: {order.shippingAddress.city}
              <br />
              Subcity: {order.shippingAddress.subcity}
              <br />
              Woreda: {order.shippingAddress.woreda}
              <br />
              Kebele: {order.shippingAddress.kebele}
              <br />
              Specific location: {order.shippingAddress.specificLocation}
            </>
          )}
        </p>
        {order.payment?.method && (
          <p className="mt-3 text-muted-foreground">
            Payment:{" "}
            <span className="text-foreground">
              {order.payment.method === "cod"
                ? cashOnFulfillmentLabel(order.deliveryMethod)
                : (paymentMethodLabels[order.payment.method] ?? order.payment.method)}
            </span>
          </p>
        )}
        <p className="mt-4 font-semibold">
          Total: ${order.total.toFixed(2)} (incl. tax ${order.tax.toFixed(2)})
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-lg border border-border bg-background p-3"
          >
            {item.imageUrl && (
              <img
                src={assetUrl(item.imageUrl)}
                alt=""
                className="h-16 w-16 rounded-md object-contain"
              />
            )}
            <div>
              <p className="font-medium">{item.listingName}</p>
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
