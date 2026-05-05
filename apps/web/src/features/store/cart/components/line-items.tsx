import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { assetUrl } from "@/lib/api";
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
          Your cart is empty. Browse the shop and add listings to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
        >
          <div className="flex min-w-0 flex-1 gap-3 sm:contents">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-50">
              <img
                src={assetUrl(item.imageUrl)}
                alt={item.name}
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2 sm:block">
                <div className="min-w-0">
                  <h4 className="wrap-break-word text-sm font-medium">{item.name}</h4>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">{item.variant}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500 sm:hidden"
                  onClick={() => onRemove?.(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 sm:contents">
            <div className="flex shrink-0 items-center gap-2">
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
              <span className="w-6 text-center text-sm font-medium tabular-nums">
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

            <span className="min-w-0 text-right text-sm font-semibold tabular-nums sm:w-24 sm:shrink-0">
              ETB {(item.price * item.quantity).toFixed(2)}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="hidden h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500 sm:inline-flex"
              onClick={() => onRemove?.(item.id)}
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
