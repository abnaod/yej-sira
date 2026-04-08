import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { OrderSummary } from "@/features/orders";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";

import {
  cartQuery,
  removeCartItemMutationOptions,
  updateCartItemMutationOptions,
  applyPromoMutationOptions,
} from "./cart.queries";

import { LineItems, type LineItemData } from "./components/line-items";

export function CartPage() {
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cartData } = useSuspenseQuery(cartQuery(locale));

  const updateQty = useMutation(updateCartItemMutationOptions(queryClient, locale));
  const removeItem = useMutation(removeCartItemMutationOptions(queryClient, locale));

  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    discount: number;
    discountLabel: string;
  } | null>(null);

  const applyPromo = useMutation(
    applyPromoMutationOptions(queryClient, locale, {
      onSuccess: (data) => {
        setPromoApplied({
          code: data.code,
          discount: data.discount,
          discountLabel: data.discountLabel,
        });
        setPromoError(null);
      },
      onError: (err) => {
        setPromoError(err instanceof Error ? err.message : "Invalid promo code");
        setPromoApplied(null);
      },
    }),
  );

  const { items, subtotal, shipping, tax, total } = cartData;

  const lineItems: LineItemData[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    variant: i.variant,
    price: i.price,
    quantity: i.quantity,
    imageUrl: i.imageUrl,
  }));

  const isEmpty = lineItems.length === 0;
  const totalUnits = lineItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = () => {
    void router.navigate({ to: "/$locale/checkout", params: { locale } });
  };

  const handleApplyPromo = (code: string) => {
    applyPromo.mutate(code);
  };

  const discount = promoApplied?.discount ?? 0;
  const effectiveTotal = total - discount;

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>
      {!isEmpty && (
        <p className="mt-1 text-sm text-muted-foreground">
          {totalUnits} {totalUnits === 1 ? "item" : "items"}
        </p>
      )}

      <div
        className={cn(
          "grid gap-6",
          isEmpty ? "mt-12" : "mt-8 lg:grid-cols-[1fr_340px]",
        )}
      >
        <div>
          <LineItems
            items={lineItems}
            onUpdateQuantity={(id, quantity) =>
              updateQty.mutate({ itemId: id, quantity })
            }
            onRemove={(id) => removeItem.mutate(id)}
          />
        </div>
        {!isEmpty && (
          <OrderSummary
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={effectiveTotal}
            onCheckout={handleCheckout}
            onApplyPromo={handleApplyPromo}
            discount={discount}
            discountLabel={promoApplied?.discountLabel}
            promoError={promoError}
          />
        )}
      </div>
    </main>
  );
}
