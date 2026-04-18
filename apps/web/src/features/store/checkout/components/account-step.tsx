import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { BuyerInfo } from "../checkout.store";

interface AccountStepProps {
  buyer: BuyerInfo;
  onBuyerChange: (next: Partial<BuyerInfo>) => void;
  onNext: () => void;
  onBack: () => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AccountStep({ buyer, onBuyerChange, onNext, onBack }: AccountStepProps) {
  const fullNameOk = buyer.fullName.trim().length > 0;
  const emailOk = isValidEmail(buyer.email);
  const canContinue = fullNameOk && emailOk;

  const handleNext = () => {
    if (!canContinue) return;
    onNext();
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-white p-5">
      <div className="min-h-0 flex-1">
        <h3 className="text-base font-semibold">Contact</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We will use these details for order updates and payment.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="checkout-full-name" className="mb-1.5 block text-sm text-label-foreground">
              Full name
            </label>
            <Input
              id="checkout-full-name"
              autoComplete="name"
              placeholder="Your name"
              value={buyer.fullName}
              onChange={(e) => onBuyerChange({ fullName: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="checkout-email" className="mb-1.5 block text-sm text-label-foreground">
              Email
            </label>
            <Input
              id="checkout-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={buyer.email}
              onChange={(e) => onBuyerChange({ email: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="checkout-phone" className="mb-1.5 block text-sm text-label-foreground">
              Phone <span className="font-normal">(optional)</span>
            </label>
            <Input
              id="checkout-phone"
              type="tel"
              autoComplete="tel"
              placeholder="Mobile number"
              value={buyer.phone}
              onChange={(e) => onBuyerChange({ phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto flex w-full shrink-0 items-center justify-between gap-3 pt-6">
        <Button variant="outline" size="lg" type="button" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button size="lg" type="button" onClick={handleNext} disabled={!canContinue}>
          Continue
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
