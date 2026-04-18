import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { assetUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import {
  adminOrderDetailQuery,
  updateAdminOrderStatusMutation,
  type AdminOrderDetail,
} from "./orders.queries";
import { formatDateTime, formatMoney } from "@/features/shared/formatters";

type Status = AdminOrderDetail["status"];

const ALL_STATUSES: Status[] = [
  "pending",
  "awaiting_payment",
  "paid",
  "fulfilled",
  "cancelled",
];

export function AdminOrderDetailPage() {
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(adminOrderDetailQuery(orderId));
  const mutation = useMutation(updateAdminOrderStatusMutation(queryClient));

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (error || !data) {
    return <p className="text-muted-foreground">Order not found.</p>;
  }

  const order = data.order;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Order</span>
          <span className="font-mono text-sm font-medium uppercase">{order.id}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="capitalize" variant="outline">
            {order.status.replace(/_/g, " ")}
          </Badge>
          {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              disabled={mutation.isPending}
              className="h-8 capitalize"
              onClick={() =>
                mutation.mutate(
                  { id: order.id, status: s },
                  {
                    onSuccess: () => toast.success(`Order marked ${s.replace(/_/g, " ")}`),
                    onError: (err: unknown) =>
                      toast.error(err instanceof Error ? err.message : "Failed"),
                  },
                )
              }
            >
              Mark {s.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 gap-0 py-4">
          <CardHeader className="pb-2">
            <CardDescription>Items ({order.items.length})</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2">
                  <div className="size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    {item.imageUrl ? (
                      <img
                        src={assetUrl(item.imageUrl)}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-5" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{item.listingName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.variantLabel ?? ""}{" "}
                      {item.variantLabel ? "· " : ""}
                      {item.quantity} × {formatMoney(item.unitPrice)}
                    </span>
                  </div>
                  <span className="tabular-nums font-medium">
                    {formatMoney(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">{formatMoney(order.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="tabular-nums">{formatMoney(order.tax)}</dd>
              </div>
              <div className="flex justify-between pt-1 font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="gap-0 py-4">
            <CardHeader className="pb-2">
              <CardDescription>Customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.user.name || "—"}</p>
              <p className="text-muted-foreground">{order.user.email}</p>
              <p className="pt-2 text-xs text-muted-foreground">
                Placed {formatDateTime(order.createdAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardHeader className="pb-2">
              <CardDescription>Delivery</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="capitalize font-medium">{order.deliveryMethod}</p>
              {order.deliveryMethod === "pickup" && order.pickupLocation ? (
                <div className="mt-1 text-muted-foreground">
                  <p>{order.pickupLocation.name}</p>
                  <p>
                    {order.pickupLocation.line1}
                    {order.pickupLocation.line2 ? `, ${order.pickupLocation.line2}` : ""}
                  </p>
                  <p>{order.pickupLocation.city}</p>
                </div>
              ) : (
                <div className="mt-1 text-muted-foreground">
                  <p>{order.shippingAddress.specificLocation}</p>
                  <p>
                    {order.shippingAddress.kebele}, {order.shippingAddress.woreda}
                  </p>
                  <p>
                    {order.shippingAddress.subcity}, {order.shippingAddress.city}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 py-4">
            <CardHeader className="pb-2">
              <CardDescription>Payment</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {order.payment ? (
                <>
                  <p className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">
                      {order.payment.method ?? "unknown"}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {order.payment.status}
                    </Badge>
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                    {order.payment.txRef}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No payment recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
