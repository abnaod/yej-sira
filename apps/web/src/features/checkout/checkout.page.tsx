import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { OrderSummary } from "@/features/orders";
import { cartQuery } from "@/features/cart/cart.queries";
import { useLocale } from "@/lib/locale-path";

import { ShippingStep, type ShippingFormValues } from "./components/shipping-step";
import { checkoutMutationOptions } from "./checkout.queries";

const emptyAddr: ShippingFormValues = {
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
};

export function CheckoutPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addr, setAddr] = useState<ShippingFormValues>(emptyAddr);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: cartData } = useSuspenseQuery(cartQuery(locale));

  const checkout = useMutation({
    ...checkoutMutationOptions(queryClient, locale, {
      onSuccess: (data) => {
        void navigate({
          to: "/$locale/orders/$orderId",
          params: { locale, orderId: data.order.id },
        });
      },
      onError: (err) => {
        setSubmitError(err instanceof Error ? err.message : "Checkout failed");
      },
    }),
    onMutate: () => setSubmitError(null),
  });

  const { subtotal, shipping, tax, total } = cartData;

  return (
    <main>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ShippingStep
          value={addr}
          onChange={(next) => setAddr((prev) => ({ ...prev, ...next }))}
          onSubmit={() =>
            checkout.mutate({
              line1: addr.line1,
              line2: addr.line2 || undefined,
              city: addr.city,
              postalCode: addr.postalCode,
              country: addr.country,
            })
          }
          isSubmitting={checkout.isPending}
          error={submitError}
        />
        <OrderSummary
          subtotal={subtotal}
          shipping={shipping}
          tax={tax}
          total={total}
        />
      </div>
    </main>
  );
}
