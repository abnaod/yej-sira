import { useState } from "react";
import { Heart, Minus, Plus, RotateCcw, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

export interface ProductVariantOption {
  id: string;
  label: string;
  colorHex?: string;
  price: number;
  stock: number;
}

interface BuyBoxProps {
  name: string;
  description?: string;
  monthlyPrice?: number;
  financingNote?: string;
  rating: number;
  reviewCount: number;
  variants: ProductVariantOption[];
  /** Active merchandising promotion (Phase A — display only; checkout uses list price). */
  promotion?: { badgeLabel: string; endsAt: string };
  onBuyNow?: (payload: { variantId: string; quantity: number }) => void;
  onAddToCart?: (payload: { variantId: string; quantity: number }) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoritePending?: boolean;
}

export function BuyBox({
  name,
  description,
  monthlyPrice,
  financingNote,
  rating,
  reviewCount,
  variants,
  onBuyNow,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  favoritePending,
  promotion,
}: BuyBoxProps) {
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const v = variants[selected];
  const price = v?.price ?? 0;
  const stock = v?.stock ?? 0;

  const setQty = (next: number) => {
    const capped = Math.min(Math.max(1, next), Math.max(1, stock));
    setQuantity(capped);
  };

  if (!v) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            disabled={favoritePending}
            onClick={onToggleFavorite}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-neutral-50",
              isFavorite ? "text-red-600" : "text-muted-foreground hover:text-red-600",
              favoritePending && "opacity-60",
            )}
          >
            <Heart
              className="h-5 w-5"
              strokeWidth={1.75}
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        )}
      </div>

      <StarRating rating={rating} reviewCount={reviewCount} size="md" />

      {promotion && (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <span className="font-semibold text-primary">{promotion.badgeLabel}</span>
          <span className="text-muted-foreground">
            {" "}
            · Ends{" "}
            {new Date(promotion.endsAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </p>
      )}

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

      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            {variants.some((x) => x.colorHex) ? "Choose a Color" : "Option"}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant, i) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelected(i);
                  setQuantity(1);
                }}
                className={cn(
                  variant.colorHex
                    ? "h-8 w-8 rounded-full border-2 transition-all"
                    : "rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all",
                  i === selected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-neutral-400",
                )}
                style={
                  variant.colorHex ? { backgroundColor: variant.colorHex } : undefined
                }
                title={variant.label}
              >
                {!variant.colorHex ? variant.label : null}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQty(quantity - 1)}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="flex h-9 w-8 items-center justify-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQty(quantity + 1)}
            disabled={quantity >= stock}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {stock > 0 && (
          <p className="text-sm text-muted-foreground">
            Only <span className="font-semibold text-primary">{stock} Items</span>{" "}
            Left! Don&apos;t miss it
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={stock < 1}
          onClick={() => onBuyNow?.({ variantId: v.id, quantity })}
        >
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={stock < 1}
          onClick={() => onAddToCart?.({ variantId: v.id, quantity })}
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
