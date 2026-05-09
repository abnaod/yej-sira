import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banknote, ChevronLeft, ChevronRight, CreditCard, Loader2, Smartphone } from "lucide-react";

import type { DeliveryMethod } from "../types";

export type PaymentMethod = "chapa" | "telebirr" | "cod";

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const basePaymentOptions: PaymentOption[] = [
  {
    id: "chapa",
    label: "Chapa",
    description: "Pay securely via Chapa payment gateway",
    icon: <CreditCard className="size-5" strokeWidth={1.5} />,
  },
  {
    id: "telebirr",
    label: "telebirr",
    description: "Pay using telebirr mobile money",
    icon: <Smartphone className="size-5" strokeWidth={1.5} />,
  },
];

function codOptionForDelivery(deliveryMethod: DeliveryMethod): Omit<PaymentOption, "icon"> {
  if (deliveryMethod === "pickup") {
    return {
      id: "cod",
      label: "Cash on pickup",
      description: "Pay with cash when you collect your order at the store",
    };
  }
  return {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay with cash when your order is delivered to your address",
  };
}

function paymentStepIntro(deliveryMethod: DeliveryMethod): string {
  if (deliveryMethod === "pickup") {
    return "Select your preferred payment method. For online options you will be redirected to complete payment; cash on pickup is settled when you collect your order.";
  }
  return "Select your preferred payment method. For online options you will be redirected to complete payment; cash on delivery is settled when your order is delivered.";
}

/** Label for COD / cash at collection, for use in order UI. */
export function cashOnFulfillmentLabel(deliveryMethod: DeliveryMethod): string {
  return deliveryMethod === "pickup" ? "Cash on pickup" : "Cash on delivery";
}

interface PaymentMethodStepProps {
  deliveryMethod: DeliveryMethod;
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  /** True while the order is being created; false while redirecting to the payment gateway. */
  isPlacingOrder: boolean;
  submitDisabled?: boolean;
  error?: string | null;
}

export function PaymentMethodStep({
  deliveryMethod,
  value,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
  isPlacingOrder,
  submitDisabled = false,
  error,
}: PaymentMethodStepProps) {
  const cod = codOptionForDelivery(deliveryMethod);
  const paymentOptions: PaymentOption[] = [
    ...basePaymentOptions,
    { ...cod, icon: <Banknote className="size-5" strokeWidth={1.5} /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-background p-5">
      <div className="min-h-0 flex-1">
      <h3 className="text-base font-semibold">Payment Method</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {paymentStepIntro(deliveryMethod)}
      </p>

      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as PaymentMethod)}
        className="mt-4 flex flex-col gap-2"
      >
        {paymentOptions.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-2.5 rounded-md border bg-background px-3 py-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
              value === option.id ? "border-primary" : "border-border"
            }`}
          >
            <RadioGroupItem
              value={option.id}
              id={option.id}
              className="size-3.5 shrink-0 origin-center border-[0.5px] transition-transform data-[state=unchecked]:scale-[0.88]"
            />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                {option.icon}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium leading-tight">{option.label}</span>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      </div>

      <div className="mt-auto flex w-full shrink-0 items-center justify-between gap-3 pt-6">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isSubmitting}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting || submitDisabled}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {isPlacingOrder ? "Placing order…" : "Redirecting…"}
            </>
          ) : value === "cod" ? (
            <>
              Place order
              <ChevronRight className="size-4" aria-hidden />
            </>
          ) : (
            <>
              Pay now
              <ChevronRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
