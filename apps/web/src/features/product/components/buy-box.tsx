import { useState } from "react";
import { Minus, Plus, Truck, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

interface BuyBoxProps {
  name: string;
  description?: string;
  price: number;
  monthlyPrice?: number;
  financingNote?: string;
  rating: number;
  reviewCount: number;
  colors?: { name: string; value: string }[];
  stock?: number;
  onBuyNow?: () => void;
  onAddToCart?: () => void;
}

const defaultColors = [
  { name: "Natural", value: "#D4C4B0" },
  { name: "Sage", value: "#9CAF88" },
  { name: "Terracotta", value: "#C67B5C" },
  { name: "Indigo", value: "#4A5D6B" },
];

export function BuyBox({
  name,
  description,
  price,
  monthlyPrice,
  financingNote,
  rating,
  reviewCount,
  colors = defaultColors,
  stock,
  onBuyNow,
  onAddToCart,
}: BuyBoxProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <StarRating rating={rating} reviewCount={reviewCount} size="md" />

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">${price.toFixed(2)}</span>
          {monthlyPrice && (
            <span className="text-sm text-muted-foreground">
              or {monthlyPrice.toFixed(2)}/month
            </span>
          )}
        </div>
        {financingNote && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {financingNote}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Choose a Color</p>
        <div className="flex gap-2">
          {colors.map((color, i) => (
            <button
              key={color.name}
              type="button"
              onClick={() => setSelectedColor(i)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                i === selectedColor
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-neutral-400",
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="flex h-9 w-8 items-center justify-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {stock !== undefined && stock > 0 && (
          <p className="text-sm text-muted-foreground">
            Only <span className="font-semibold text-primary">{stock} Items</span>{" "}
            Left! Don&apos;t miss it
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={onBuyNow}>
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onAddToCart}
        >
          Add to Cart
        </Button>
      </div>

      <div className="mt-1 space-y-3 rounded-lg border border-border p-4">
        <div className="flex gap-3">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Free Delivery</p>
            <p className="text-xs text-muted-foreground">
              <a href="#" className="underline underline-offset-2 hover:text-primary">
                Enter your Postal code for Delivery Availability
              </a>
            </p>
          </div>
        </div>
        <hr className="border-border" />
        <div className="flex gap-3">
          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Return Delivery</p>
            <p className="text-xs text-muted-foreground">
              Free 30 Days Delivery Returns.{" "}
              <a href="#" className="underline underline-offset-2 hover:text-primary">
                Details
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
