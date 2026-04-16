import { useState } from "react";
import { Heart, Minus, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { AddToCartInput } from "@/features/cart/cart.queries";
import { useLocale } from "@/lib/locale-path";
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
  shop?: { slug: string; name: string; imageUrl: string | null };
  monthlyPrice?: number;
  financingNote?: string;
  rating: number;
  reviewCount: number;
  variants: ProductVariantOption[];
  /** Active merchandising promotion (Phase A — display only; checkout uses list price). */
  promotion?: { badgeLabel: string; endsAt: string };
  onBuyNow?: (payload: AddToCartInput) => void;
  onAddToCart?: (payload: AddToCartInput) => void;
  /** When set, purchase CTAs are disabled (e.g. draft storefront preview). */
  purchaseDisabled?: boolean;
  purchaseDisabledReason?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoritePending?: boolean;
}

export function BuyBox({
  name,
  description,
  shop,
  monthlyPrice,
  financingNote,
  rating,
  reviewCount,
  variants,
  onBuyNow,
  onAddToCart,
  purchaseDisabled,
  purchaseDisabledReason,
  isFavorite,
  onToggleFavorite,
  favoritePending,
  promotion,
}: BuyBoxProps) {
  const { t } = useTranslation("common");
  const locale = useLocale();
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
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
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

      {shop && (
        <p className="text-sm text-muted-foreground">
          {t("soldBy")}{" "}
          <Link
            to="/$locale/shops/$shopSlug"
            params={{ locale, shopSlug: shop.slug }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {shop.name}
          </Link>
        </p>
      )}

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

      {purchaseDisabled && purchaseDisabledReason ? (
        <p className="text-sm text-muted-foreground">{purchaseDisabledReason}</p>
      ) : null}
      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={stock < 1 || purchaseDisabled}
          onClick={() => onBuyNow?.({ variantId: v.id, quantity, productName: name })}
        >
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={stock < 1 || purchaseDisabled}
          onClick={() =>
            onAddToCart?.({ variantId: v.id, quantity, productName: name })
          }
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
