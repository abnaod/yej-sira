import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Package, Store, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-path";

import type { OrdersListResponse } from "./orders.queries";
import { ordersListQuery } from "./orders.queries";

type OrderRow = OrdersListResponse["orders"][number];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "paid" }
> = {
  pending: { label: "Pending", variant: "outline" },
  awaiting_payment: { label: "Awaiting payment", variant: "secondary" },
  paid: { label: "Paid", variant: "paid" },
  fulfilled: { label: "Fulfilled", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const TAB_ORDER = [
  "all",
  "pending",
  "awaiting_payment",
  "paid",
  "fulfilled",
  "cancelled",
] as const;

type TabValue = (typeof TAB_ORDER)[number];

const TAB_LABELS: Record<TabValue, string> = {
  all: "All",
  pending: "Pending",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

function paymentMethodLabel(
  method: NonNullable<OrderRow["payment"]>["method"] | null | undefined,
  deliveryMethod: OrderRow["deliveryMethod"],
): string | null {
  if (!method) return null;
  switch (method) {
    case "chapa":
      return "Chapa";
    case "telebirr":
      return "telebirr";
    case "cod":
      return deliveryMethod === "pickup" ? "Cash on pickup" : "Cash on delivery";
    default:
      return null;
  }
}

function deliveryLabel(deliveryMethod: OrderRow["deliveryMethod"]): string {
  return deliveryMethod === "pickup" ? "Store pickup" : "Standard delivery";
}

function orderReference(id: string): string {
  const tail = id.slice(-8).toUpperCase();
  return `#${tail}`;
}

function formatDate(iso: string, locale: string): string {
  const tag = locale === "am" ? "am-ET" : "en-GB";
  return new Date(iso).toLocaleDateString(tag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrdersEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-[min(36vh,280px)] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden
      >
        <Package className="size-7" strokeWidth={1.5} />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">{message}</p>
    </div>
  );
}

function OrderListRow({ order, locale }: { order: OrderRow; locale: string }) {
  const config = statusConfig[order.status] ?? {
    label: order.status,
    variant: "outline" as const,
  };
  const payLabel = paymentMethodLabel(
    order.payment?.method ?? null,
    order.deliveryMethod,
  );

  return (
    <li>
      <Link
        to="/$locale/orders/$orderId"
        params={{ locale, orderId: order.id }}
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-sm transition-colors",
          "hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:hover:bg-gray-800",
        )}
      >
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">
              Order {orderReference(order.id)}
            </span>
            <Badge variant={config.variant} className="text-xs font-medium">
              {config.label}
            </Badge>
          </div>
          <div className="flex flex-col gap-1.5 text-muted-foreground">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                {formatDate(order.createdAt, locale)}
              </span>
              <span className="hidden text-border sm:inline" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="size-3.5 shrink-0 opacity-70" aria-hidden />
                {order.itemCount === 1 ? "1 item" : `${order.itemCount} items`}
              </span>
              <span className="hidden text-border sm:inline" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                {order.deliveryMethod === "pickup" ? (
                  <Store className="size-3.5 shrink-0 opacity-70" aria-hidden />
                ) : (
                  <Truck className="size-3.5 shrink-0 opacity-70" aria-hidden />
                )}
                {deliveryLabel(order.deliveryMethod)}
              </span>
            </p>
            {payLabel && (
              <p className="text-xs text-muted-foreground">
                Payment: <span className="text-foreground/80">{payLabel}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
          <span className="text-base font-semibold tabular-nums text-foreground">
            ETB {order.total.toFixed(2)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            View
            <ChevronRight className="size-4 opacity-70" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}

function filterOrders(orders: OrderRow[], tab: TabValue): OrderRow[] {
  if (tab === "all") return orders;
  return orders.filter((o) => o.status === tab);
}

export function OrderHistoryPage() {
  const locale = useLocale();
  const { data } = useSuspenseQuery(ordersListQuery(locale));

  const { orders } = data;

  const [tab, setTab] = useState<TabValue>("all");

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        {orders.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"} total
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <OrdersEmpty message="You haven't placed an order yet. When you do, it will show up here." />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabValue)}
          className="w-full gap-6"
        >
          <TabsList
            variant="line"
            className="h-auto min-h-0 w-full min-w-0 flex-wrap items-end justify-start gap-x-1 gap-y-0 rounded-none border-b border-border bg-transparent p-0"
          >
            {TAB_ORDER.map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex-none justify-start rounded-none px-3 py-3 text-sm data-[state=active]:shadow-none sm:text-base"
              >
                {TAB_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_ORDER.map((value) => {
            const list = filterOrders(orders, value);
            return (
              <TabsContent key={value} value={value} className="mt-0">
                {list.length === 0 ? (
                  <OrdersEmpty
                    message={
                      value === "all"
                        ? "No orders to show."
                        : `No ${TAB_LABELS[value].toLowerCase()} orders.`
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {list.map((o) => (
                      <OrderListRow key={o.id} order={o} locale={locale} />
                    ))}
                  </ul>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </main>
  );
}
