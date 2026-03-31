import { OrderSummary } from "@/features/orders/order-detail/components/order-summary";
import { ShippingStep } from "./components/shipping-step";

const subtotal = 152;
const shipping = 0;
const tax = Math.round(subtotal * 0.08 * 100) / 100;
const total = subtotal + shipping + tax;

export function CheckoutPage() {
  return (
    <main>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ShippingStep />
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
