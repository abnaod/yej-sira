import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

interface BuyBoxProps {
  name: string;
  price: number;
  monthlyPrice?: number;
  rating: number;
  reviewCount: number;
  colors?: { name: string; value: string }[];
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
  price,
  monthlyPrice,
  rating,
  reviewCount,
  colors = defaultColors,
  onBuyNow,
  onAddToCart,
}: BuyBoxProps) {
  const [selectedColor, setSelectedColor] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">{name}</h1>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold">${price.toFixed(2)}</span>
        {monthlyPrice && (
          <span className="text-sm text-muted-foreground">
            or ${monthlyPrice.toFixed(2)}/month
          </span>
        )}
      </div>

      <StarRating rating={rating} reviewCount={reviewCount} size="md" />

      <div>
        <p className="mb-2 text-sm font-medium">Choose a finish</p>
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

      <div className="mt-2 flex gap-3">
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
    </div>
  );
}
