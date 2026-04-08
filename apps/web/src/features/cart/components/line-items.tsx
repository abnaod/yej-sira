import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface LineItemData {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface LineItemsProps {
  items: LineItemData[];
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
}

export function LineItems({ items, onUpdateQuantity, onRemove }: LineItemsProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <ShoppingCart className="size-7" strokeWidth={1.5} />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          Your cart is empty. Browse the shop and add products to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-white p-4"
        >
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-neutral-50">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium">{item.name}</h4>
            {item.variant && (
              <p className="text-xs text-muted-foreground">{item.variant}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))
              }
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <span className="w-20 text-right text-sm font-semibold tabular-nums">
            ETB {(item.price * item.quantity).toFixed(2)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-500"
            onClick={() => onRemove?.(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
