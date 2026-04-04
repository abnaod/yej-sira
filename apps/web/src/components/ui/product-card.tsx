import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import type { ProductPromotionDto } from "@/features/storefront";
import { useProductFavoriteRow } from "@/features/favorites/use-product-favorite-row";

export interface ProductCardProps {
  slug: string;
  defaultVariantId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  promotion?: ProductPromotionDto;
  onAddToCart?: (variantId: string) => void;
  className?: string;
}

export function ProductCard({
  slug,
  defaultVariantId,
  name,
  price,
  originalPrice,
  description,
  imageUrl,
  rating,
  reviewCount,
  promotion,
  onAddToCart,
  className,
}: ProductCardProps) {
  const { isFavorite, onToggleWishlist, pending: favoritePending } =
    useProductFavoriteRow(slug);
  const onSale = originalPrice != null && originalPrice > price;
  return (
    <div
      className={cn(
        "group flex flex-col rounded-lg bg-white",
        className,
      )}
    >
      <Link
        to="/products/$productId"
        params={{ productId: slug }}
        className="relative aspect-4/3 overflow-hidden rounded-t-lg bg-neutral-50"
      >
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {(promotion || onSale) && (
          <div className="pointer-events-none absolute left-2 top-2 z-10">
            {promotion ? (
              <span className="inline-flex max-w-[min(100%,12rem)] truncate rounded bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                {promotion.badgeLabel}
              </span>
            ) : (
              <span className="inline-flex w-fit rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                Sale
              </span>
            )}
          </div>
        )}
        <button
          type="button"
          disabled={favoritePending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist();
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm",
            "transition-[opacity,transform,colors] duration-200 ease-out",
            "hover:bg-neutral-50",
            isFavorite
              ? cn(
                  "pointer-events-auto translate-y-0 scale-100 opacity-100",
                  favoritePending && "opacity-60",
                )
              : cn(
                  "pointer-events-none translate-y-1 scale-95 opacity-0",
                  "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100",
                  "group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100",
                  favoritePending &&
                    "group-hover:opacity-60 group-focus-within:opacity-60",
                ),
            isFavorite
              ? "text-red-500"
              : "text-neutral-500 hover:text-red-500",
          )}
        >
          <Heart
            className="h-4 w-4"
            strokeWidth={1.75}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <Link
            to="/products/$productId"
            params={{ productId: slug }}
            className="min-w-0 flex-1"
          >
            <h3 className="truncate text-sm font-medium leading-tight text-foreground transition-colors hover:text-primary">
              {name}
            </h3>
          </Link>
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
          disabled={!defaultVariantId}
          className="mt-2 w-fit border-border bg-transparent text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => defaultVariantId && onAddToCart?.(defaultVariantId)}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
