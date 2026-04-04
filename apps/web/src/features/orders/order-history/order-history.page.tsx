import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";

import { useLocale } from "@/lib/locale-path";

import { ordersListQuery } from "../orders.queries";

export function OrderHistoryPage() {
  const locale = useLocale();
  const { data } = useSuspenseQuery(ordersListQuery(locale));

  const { orders } = data;

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      {orders.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="mt-12 flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden
          >
            <Package className="size-7" strokeWidth={1.5} />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            You haven&apos;t placed an order yet. When you do, it will show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to="/$locale/orders/$orderId"
                params={{ locale, orderId: o.id }}
                className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors hover:bg-neutral-50"
              >
                <span className="font-medium">{o.id.slice(0, 8)}…</span>
                <span className="text-muted-foreground">{o.status}</span>
                <span className="font-semibold">${o.total.toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
