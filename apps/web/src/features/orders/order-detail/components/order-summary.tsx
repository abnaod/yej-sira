import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OrderSummaryItem {
  label: string;
  value: string;
}

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  className?: string;
}

export function OrderSummary({
  subtotal,
  shipping,
  tax,
  total,
  className,
}: OrderSummaryProps) {
  const lines: OrderSummaryItem[] = [
    { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
    { label: "Shipping", value: shipping === 0 ? "Free" : `$${shipping.toFixed(2)}` },
    { label: "Tax", value: `$${tax.toFixed(2)}` },
  ];

  return (
    <div className={cn("rounded-lg border border-border bg-white p-5", className)}>
      <h3 className="text-base font-semibold">Order Summary</h3>

      <div className="mt-4 space-y-2.5">
        {lines.map((line) => (
          <div
            key={line.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{line.label}</span>
            <span className="font-medium">{line.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <h4 className="mt-5 text-sm font-semibold">Payment Details</h4>
      <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          <input type="radio" name="payment" defaultChecked className="accent-primary" />
          Cash on Delivery
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="payment" className="accent-primary" />
          Yej Sira balance
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="payment" className="accent-primary" />
          Paypal
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="payment" className="accent-primary" />
          Credit or Debit Card
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <img src="https://img.icons8.com/color/32/mastercard.png" alt="Mastercard" className="h-6" />
        <img src="https://img.icons8.com/color/32/visa.png" alt="Visa" className="h-6" />
      </div>

      <Button className="mt-4 w-full" size="lg">
        Place Order
      </Button>
    </div>
  );
}
