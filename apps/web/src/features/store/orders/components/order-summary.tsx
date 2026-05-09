import { Minus, Plus, TicketPercent } from "lucide-react";

import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface OrderSummaryLineItem {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface OrderSummaryProps {
  items?: OrderSummaryLineItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  discount?: number;
  discountLabel?: string;
  promoError?: string | null;
  className?: string;
  onCheckout?: () => void;
  onApplyPromo?: (code: string) => void;
  /** When set, line items show compact − / + steppers (e.g. checkout). */
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  isUpdatingQuantity?: boolean;
}

export function OrderSummary({
  items,
  subtotal,
  shipping,
  tax,
  total,
  discount = 0,
  discountLabel,
  promoError,
  className,
  onCheckout,
  onApplyPromo,
  onUpdateQuantity,
  isUpdatingQuantity = false,
}: OrderSummaryProps) {
  const showItems = items && items.length > 0;
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = () => {
    if (!promoCode.trim() || !onApplyPromo) return;
    setIsApplyingPromo(true);
    onApplyPromo(promoCode.trim());
    setIsApplyingPromo(false);
  };

  return (
    <div
      className={cn(
        "h-fit w-full self-start rounded-lg border border-border bg-background p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        <h3 className="text-base font-semibold">Order Summary</h3>

        {showItems && (
          <div
            className="min-h-0 max-h-[calc(4*3rem+3*0.75rem)] overflow-y-auto overflow-x-hidden pr-0.5 [scrollbar-gutter:stable]"
            aria-label="Order line items"
          >
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-2 sm:gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-50">
                    <img
                      src={assetUrl(item.imageUrl)}
                      alt=""
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {onUpdateQuantity ? (
                      <div className="mt-1.5 flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          disabled={isUpdatingQuantity || item.quantity <= 1}
                          aria-label="Decrease quantity"
                          onClick={() =>
                            onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                          }
                        >
                          <Minus className="size-2.5" strokeWidth={2} />
                        </Button>
                        <span className="min-w-5 text-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          disabled={isUpdatingQuantity}
                          aria-label="Increase quantity"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="size-2.5" strokeWidth={2} />
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        ×{item.quantity}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums">
                    ETB {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={cn(
            "space-y-2",
            showItems && "border-t border-border pt-4",
          )}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">ETB {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && discountLabel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-green-600">{discountLabel}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery fee</span>
            <span className="font-medium">
              {`ETB ${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">ETB {tax.toFixed(2)}</span>
          </div>
        </div>

        {onApplyPromo && (
          <div className="flex flex-col gap-1.5 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <TicketPercent
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                  strokeWidth={2}
                />
                <Input
                  placeholder="Promo code here"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyPromo();
                    }
                  }}
                  className="h-9 pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyPromo}
                disabled={isApplyingPromo || !promoCode.trim()}
                className="h-9 w-full shrink-0 sm:w-auto"
              >
                Apply
              </Button>
            </div>
            {promoError && <p className="text-xs text-destructive">{promoError}</p>}
          </div>
        )}

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <span>ETB {total.toFixed(2)}</span>
          </div>
        </div>

        {onCheckout && (
          <Button className="w-full" size="lg" onClick={onCheckout}>
            Proceed to Checkout
          </Button>
        )}
      </div>
    </div>
  );
}
