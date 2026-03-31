import { OrderSummary } from "@/features/orders/order-detail/components/order-summary";
import { LineItems, type LineItemData } from "./components/line-items";

const mockItems: LineItemData[] = [
  {
    id: "1",
    name: "Hand-glazed stoneware vase",
    variant: "Glaze: Celadon",
    price: 68.0,
    quantity: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=200&q=80",
  },
  {
    id: "2",
    name: "Handwoven cotton market tote",
    variant: "Natural undyed",
    price: 42.0,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=200&q=80",
  },
];

const subtotal = 68 + 42 * 2;
const shipping = 0;
const tax = Math.round(subtotal * 0.08 * 100) / 100;
const total = subtotal + shipping + tax;

export function CartPage() {
  return (
    <main>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Review Item And Shipping
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <LineItems items={mockItems} />
        </div>
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
