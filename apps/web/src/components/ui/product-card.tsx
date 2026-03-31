import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  onAddToCart?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  description,
  imageUrl,
  rating,
  reviewCount,
  onAddToCart,
  onToggleWishlist,
  className,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-lg bg-white",
        className,
      )}
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-t-lg bg-neutral-50">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={() => onToggleWishlist?.(id)}
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-red-500"
        >
          <Heart className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-foreground">
            {name}
          </h3>
          <div className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-semibold">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {description && (
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}

        <StarRating
          rating={rating}
          reviewCount={reviewCount}
          className="mt-1"
        />

        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-fit border-border bg-transparent text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => onAddToCart?.(id)}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
