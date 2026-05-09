import type { Locale } from "@ys/intl";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  CreditCard,
  ImageIcon,
  MapPin,
  MoreHorizontal,
  Package,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { cashOnFulfillmentLabel } from "@/features/store/checkout/components/payment-method-step";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { sellerOrderDetailQuery } from "./orders.queries";

const routeApi = getRouteApi("/$locale/(seller)/sell/orders/$orderId");

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fulfillmentLabel(status: string): { label: string; className: string } {
  switch (status) {
    case "fulfilled":
      return {
        label: "Fulfilled",
        className:
          "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "border-destructive/30 bg-destructive/10 text-destructive",
      };
    default:
      return {
        label: "Unfulfilled",
        className:
          "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100",
      };
  }
}

function paymentStateBadge(order: {
  status: string;
  payment: { status: string } | null;
}): { label: string; className: string } | null {
  if (order.status === "cancelled") return null;
  if (order.status === "awaiting_payment") {
    return {
      label: "Payment pending",
      className:
        "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100",
    };
  }
  const ps = order.payment?.status;
  if (ps === "pending") {
    return {
      label: "Payment pending",
      className:
        "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100",
    };
  }
  if (ps === "failed") {
    return {
      label: "Payment failed",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }
  if (order.status === "paid" || order.status === "fulfilled" || ps === "completed") {
    return {
      label: "Paid",
      className: "border-transparent bg-green-600 text-white dark:bg-green-600",
    };
  }
  return {
    label: "Payment pending",
    className:
      "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-100",
  };
}

const paymentMethodLabels: Record<"chapa" | "telebirr", string> = {
  chapa: "Chapa",
  telebirr: "Telebirr",
};

function OrderSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/35 px-5 py-4">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="text-xss text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function SellerOrderDetailPage() {
  const { orderId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;

  const detailQuery = useQuery({
    ...sellerOrderDetailQuery(locale, orderId),
    enabled: !import.meta.env.SSR,
  });

  if (import.meta.env.SSR) {
    return (
      <div className="w-full py-8 text-muted-foreground">Loading…</div>
    );
  }

  if (detailQuery.isError) {
    const message =
      detailQuery.error instanceof Error ? detailQuery.error.message : "Something went wrong";
    return (
      <div className="w-full py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
        <p className="mt-2 text-destructive">{message}</p>
      </div>
    );
  }

  if (detailQuery.data == null) {
    return (
      <div className="w-full py-8 text-muted-foreground">Loading…</div>
    );
  }

  const { order } = detailQuery.data;

  const placedAt = new Date(order.createdAt);
  const dateLine = placedAt.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const isPickup = order.deliveryMethod === "pickup" && order.pickupLocation;
  const fulfill = fulfillmentLabel(order.status);
  const payBadge = paymentStateBadge(order);

  const copyOrderId = () => {
    void navigator.clipboard.writeText(order.id);
    toast.success("Order ID copied");
  };

  const copyPageUrl = () => {
    void navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  const itemsSubtotal = order.items.reduce(
    (acc, i) => acc + i.quantity * i.unitPrice,
    0,
  );

  return (
    <div className="@container/main flex min-h-0 w-full min-w-0 flex-1 flex-col space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="-ms-2 gap-1.5 px-2 text-muted-foreground" asChild>
            <Link to="/$locale/sell/orders" params={{ locale }}>
              <ArrowLeft className="size-4" />
              Back to orders
            </Link>
          </Button>
        </div>

        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Order{" "}
                <span className="font-mono text-lg font-medium break-all text-muted-foreground sm:text-xl">
                  {order.id}
                </span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {payBadge ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    payBadge.className,
                  )}
                >
                  {payBadge.label}
                </span>
              ) : null}
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  fulfill.className,
                )}
              >
                {fulfill.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{dateLine}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={copyOrderId}>
              <Copy className="size-3.5" />
              Copy ID
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <MoreHorizontal className="size-3.5" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={copyOrderId}>
                  <Copy className="size-3.5" />
                  Copy order ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyPageUrl}>Copy page link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20rem)] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <OrderSection title="Order items" description="Listings from your shop on this order.">
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/50">
                      {item.imageUrl ? (
                        <img
                          src={assetUrl(item.imageUrl)}
                          alt=""
                          className="size-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-7 opacity-45" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug text-foreground">{item.listingName}</p>
                        {item.variantLabel ? (
                          <p className="mt-1 text-sm text-muted-foreground">{item.variantLabel}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end sm:text-right">
                        <p className="text-sm tabular-nums text-muted-foreground">
                          {item.quantity} × {formatMoney(item.unitPrice)}
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMoney(lineTotal)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </OrderSection>

          <OrderSection title="Order summary" description="Amounts for your shop’s lines only.">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Items subtotal</dt>
                <dd className="tabular-nums text-foreground">{formatMoney(itemsSubtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-right text-muted-foreground">Set at checkout</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-4 text-base font-semibold">
                <dt className="text-foreground">Your total</dt>
                <dd className="tabular-nums text-foreground">{formatMoney(order.shopSubtotal)}</dd>
              </div>
            </dl>
            {order.payment?.method != null ? (
              <div className="mt-5 rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">Payment</p>
                <p className="mt-1 text-muted-foreground">
                  {order.payment.method === "cod"
                    ? cashOnFulfillmentLabel(order.deliveryMethod)
                    : (paymentMethodLabels[order.payment.method] ?? order.payment.method)}
                  {order.payment.status ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {order.payment.status.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </p>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyOrderId}>
                Copy order ID
              </Button>
            </div>
          </OrderSection>

          <Card className="gap-0 overflow-hidden py-0 shadow-xs">
            <CardHeader className="border-b border-border bg-muted/35 px-5 py-4">
              <CardTitle className="text-sm font-semibold">Activity</CardTitle>
              <CardDescription>Timeline for this order</CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Order placed</span> — {dateLine}
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Card className="gap-0 overflow-hidden py-0 shadow-xs">
            <CardHeader className="border-b border-border bg-muted/35 px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  aria-hidden
                >
                  {isPickup ? <Store className="size-4" /> : <MapPin className="size-4" />}
                </span>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {isPickup ? "Pick up" : "Shipping address"}
                  </CardTitle>
                  <CardDescription>
                    {isPickup ? "Customer pickup location" : "Delivery details"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
              {isPickup && order.pickupLocation ? (
                <address className="not-italic">
                  <p className="font-medium text-foreground">{order.pickupLocation.name}</p>
                  <p className="mt-2">
                    {order.pickupLocation.line1}
                    {order.pickupLocation.line2 ? `, ${order.pickupLocation.line2}` : ""}
                  </p>
                  <p>
                    {order.pickupLocation.city}, {order.pickupLocation.postalCode}
                  </p>
                  <p>{order.pickupLocation.country}</p>
                </address>
              ) : (
                <dl className="space-y-2">
                  {(
                    [
                      ["City", order.shippingAddress.city],
                      ["Subcity", order.shippingAddress.subcity],
                      ["Woreda", order.shippingAddress.woreda],
                      ["Kebele", order.shippingAddress.kebele],
                      ["Location", order.shippingAddress.specificLocation],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xss uppercase tracking-wide text-muted-foreground">{label}</dt>
                      <dd className="text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0 shadow-xs">
            <CardHeader className="border-b border-border bg-muted/35 px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  aria-hidden
                >
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <CardTitle className="text-sm font-semibold">Payment</CardTitle>
                  <CardDescription>Method and status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-4 text-sm">
              {order.payment?.method != null ? (
                <>
                  <p className="text-foreground">
                    {order.payment.method === "cod"
                      ? cashOnFulfillmentLabel(order.deliveryMethod)
                      : (paymentMethodLabels[order.payment.method] ?? order.payment.method)}
                  </p>
                  {order.payment.status ? (
                    <p className="capitalize text-muted-foreground">
                      Status: {order.payment.status.replace(/_/g, " ")}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">No payment record for this order.</p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden border-dashed py-0 shadow-xs">
            <CardHeader className="border-b border-dashed border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                  aria-hidden
                >
                  <Package className="size-4" />
                </span>
                <div>
                  <CardTitle className="text-sm font-semibold">Notes</CardTitle>
                  <CardDescription>Internal notes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <p className="text-sm text-muted-foreground">
                Notes aren&apos;t available yet. Use your own tools to track fulfillment details.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
