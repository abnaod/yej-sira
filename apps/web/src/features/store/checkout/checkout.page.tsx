import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import { OrderSummary } from "@/features/store/orders";
import {
  applyPromoMutationOptions,
  cartQuery,
  updateCartItemMutationOptions,
} from "@/features/store/cart/cart.queries";
import { useLocale } from "@/lib/locale-path";
import { apiFetchJson } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AccountStep } from "./components/account-step";
import { DeliveryStep } from "./components/delivery-step";
import { PaymentMethodStep } from "./components/payment-method-step";
import { CheckoutProgressBar } from "./components/checkout-progress-bar";
import { checkoutMutationOptions, pickupLocationsQuery } from "./checkout.queries";
import {
  checkoutStepAtom,
  checkoutShippingAtom,
  checkoutDeliveryMethodAtom,
  checkoutPickupLocationIdAtom,
  checkoutPaymentMethodAtom,
  checkoutBuyerAtom,
} from "./checkout.store";
import { DELIVERY_CITY_DEFAULT } from "./constants";
import type { ShippingFormValues } from "./types";
import { useAtom } from "jotai";

const emptyAddr: ShippingFormValues = {
  city: DELIVERY_CITY_DEFAULT,
  subcity: "",
  woreda: "",
  kebele: "",
  specificLocation: "",
};

type InitializePaymentResponse = {
  checkoutUrl: string;
  txRef: string;
  orderId: string;
};

async function initializePayment(
  orderId: string,
  locale: string,
): Promise<InitializePaymentResponse> {
  return apiFetchJson<InitializePaymentResponse>("/api/payments/chapa/initialize", {
    method: "POST",
    body: JSON.stringify({ orderId, locale }),
  });
}

export function CheckoutPage() {
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useAtom(checkoutStepAtom);
  const [shipping] = useAtom(checkoutShippingAtom);
  const [deliveryMethod, setDeliveryMethod] = useAtom(checkoutDeliveryMethodAtom);
  const [pickupLocationId, setPickupLocationId] = useAtom(checkoutPickupLocationIdAtom);
  const [paymentMethod, setPaymentMethod] = useAtom(checkoutPaymentMethodAtom);
  const [buyer, setBuyer] = useAtom(checkoutBuyerAtom);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) return;
    setBuyer((prev) => ({
      fullName: prev.fullName || session.user.name || "",
      email: prev.email || session.user.email || "",
      phone: prev.phone,
    }));
  }, [session?.user?.id, session?.user?.name, session?.user?.email, setBuyer]);

  const [addr, setAddr] = useState<ShippingFormValues>(
    shipping
      ? {
          city: shipping.city,
          subcity: shipping.subcity,
          woreda: shipping.woreda,
          kebele: shipping.kebele,
          specificLocation: shipping.specificLocation,
        }
      : emptyAddr,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** True after Chapa init succeeds until the browser navigates away. */
  const [awaitingChapaRedirect, setAwaitingChapaRedirect] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    discount: number;
    discountLabel: string;
  } | null>(null);

  const { data: cartData } = useSuspenseQuery(cartQuery(locale));
  const { data: pickupData } = useSuspenseQuery(pickupLocationsQuery(locale));
  const pickupLocations = pickupData.locations;

  const setPickupLocationIdStable = useCallback(
    (id: string) => {
      setPickupLocationId(id);
    },
    [setPickupLocationId],
  );

  const selectedPickup =
    pickupLocationId != null
      ? (pickupLocations.find((l) => l.id === pickupLocationId) ?? null)
      : null;

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

  const updateQty = useMutation(updateCartItemMutationOptions(queryClient, locale));

  const initializePaymentMutation = useMutation({
    mutationFn: (orderId: string) => initializePayment(orderId, locale),
    onSuccess: (data) => {
      setAwaitingChapaRedirect(true);
      window.location.assign(data.checkoutUrl);
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["cart", locale] });
      setSubmitError(err instanceof Error ? err.message : "Payment initialization failed");
    },
  });

  const checkout = useMutation({
    ...checkoutMutationOptions(queryClient, locale, {
      onSuccess: (data, variables) => {
        if (variables.paymentMethod === "cod") {
          void queryClient.invalidateQueries({ queryKey: ["cart", locale] });
          void router.navigate({
            to: "/$locale/orders/$orderId",
            params: { locale, orderId: data.order.id },
          });
          return;
        }
        initializePaymentMutation.mutate(data.order.id);
      },
      onError: (err) => {
        setSubmitError(err instanceof Error ? err.message : "Checkout failed");
      },
    }),
    onMutate: () => setSubmitError(null),
  });

  const handlePlaceOrder = () => {
    const buyerPayload = {
      fullName: buyer.fullName.trim(),
      email: buyer.email.trim(),
      phone: buyer.phone.trim() || undefined,
    };
    if (deliveryMethod === "standard") {
      checkout.mutate({
        deliveryMethod: "standard",
        ...buyerPayload,
        city: addr.city.trim() || DELIVERY_CITY_DEFAULT,
        subcity: addr.subcity.trim(),
        woreda: addr.woreda.trim(),
        kebele: addr.kebele.trim(),
        specificLocation: addr.specificLocation.trim(),
        paymentMethod,
      });
      return;
    }
    if (!pickupLocationId) return;
    checkout.mutate({
      deliveryMethod: "pickup",
      ...buyerPayload,
      pickupLocationId,
      paymentMethod,
    });
  };

  const {
    items,
    subtotal,
    shipping: shippingCost,
    standardDeliveryFeeEtb,
    tax,
  } = cartData;

  if (items.length === 0) {
    return (
      <main>
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <div className="mt-12 flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-4 px-4 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden
          >
            <ShoppingBag className="size-7" strokeWidth={1.5} />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            Your cart is empty. Add listings to your cart before you can check out.
          </p>
        </div>
      </main>
    );
  }

  const calculatedShipping = deliveryMethod === "pickup" ? 0 : shippingCost;
  const discount = promoApplied?.discount ?? 0;
  const calculatedTotal = subtotal + calculatedShipping + tax - discount;

  const handleApplyPromo = (code: string) => {
    applyPromo.mutate(code);
  };

  const orderSummaryItems = items.map((i) => ({
    id: i.id,
    name: i.name,
    variant: i.variant,
    price: i.price,
    quantity: i.quantity,
    imageUrl: i.imageUrl,
  }));

  const goToCart = () => {
    void router.navigate({ to: "/$locale/cart", params: { locale } });
  };

  return (
    <main>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:grid-rows-[auto_1fr] lg:items-stretch">
        <CheckoutProgressBar
          step={step}
          className="mb-0 shrink-0 lg:col-span-2 lg:row-start-1"
        />
        <div className="flex min-h-0 flex-col lg:col-start-1 lg:row-start-2 lg:h-full lg:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col">
            {step === "account" && (
              <AccountStep
                buyer={buyer}
                onBuyerChange={(next) => setBuyer((prev) => ({ ...prev, ...next }))}
                onNext={() => setStep("delivery")}
                onBack={goToCart}
              />
            )}

            {step === "delivery" && (
              <DeliveryStep
                deliveryMethod={deliveryMethod}
                onDeliveryMethodChange={(method) => {
                  setDeliveryMethod(method);
                  if (method === "standard") setPickupLocationId(null);
                }}
                deliveryStandardFeeEtb={standardDeliveryFeeEtb}
                pickupLocations={pickupLocations}
                pickupLocationId={pickupLocationId}
                onPickupLocationChange={setPickupLocationIdStable}
                address={addr}
                onAddressChange={(next) => setAddr((prev) => ({ ...prev, ...next }))}
                onNext={() => setStep("payment-method")}
                onBack={() => setStep("account")}
              />
            )}

            {step === "payment-method" && (
              <PaymentMethodStep
                deliveryMethod={deliveryMethod}
                value={paymentMethod}
                onChange={setPaymentMethod}
                onSubmit={handlePlaceOrder}
                onBack={() => setStep("delivery")}
                isSubmitting={
                  checkout.isPending ||
                  initializePaymentMutation.isPending ||
                  awaitingChapaRedirect
                }
                isPlacingOrder={checkout.isPending}
                submitDisabled={deliveryMethod === "pickup" && !selectedPickup}
                error={submitError}
              />
            )}
          </div>
        </div>

        <OrderSummary
          className="lg:col-start-2 lg:row-start-2 lg:self-start"
          items={orderSummaryItems}
          subtotal={subtotal}
          shipping={calculatedShipping}
          tax={tax}
          total={calculatedTotal}
          discount={discount}
          discountLabel={promoApplied?.discountLabel}
          promoError={promoError}
          onApplyPromo={handleApplyPromo}
          onUpdateQuantity={(itemId, quantity) =>
            updateQty.mutate({ itemId, quantity })
          }
          isUpdatingQuantity={updateQty.isPending}
        />
      </div>
    </main>
  );
}
