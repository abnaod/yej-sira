import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

import { assetUrl } from "@/lib/api";
import { featureCartCheckout, featureConversations } from "@/lib/features";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/features/shared/star-rating";
import type { ListingPromotionDto } from "@/features/store/home";
import { useListingFavoriteRow } from "@/features/store/favorites/hooks/use-listing-favorite-row";

export interface ListingCardProps {
  slug: string;
  defaultVariantId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  shop?: { slug: string; name: string; imageUrl: string | null };
  promotion?: ListingPromotionDto;
  onAddToCart?: (variantId: string) => void;
  /** Compact layout for carousels / horizontal rows. */
  variant?: "default" | "compact";
  /** Hide the “Sold by …” row (e.g. on the shop’s own page). */
  hideShopLine?: boolean;
  /** Show a direct link to the listing to message the seller (conversation-first). */
  messageSellerCta?: boolean;
  className?: string;
}

export function ListingCard({
  slug,
  defaultVariantId,
  name,
  price,
  originalPrice,
  description,
  imageUrl,
  rating,
  reviewCount,
  shop,
  promotion,
  onAddToCart,
  variant = "default",
  hideShopLine = false,
  messageSellerCta = false,
  className,
}: ListingCardProps) {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const { isFavorite, onToggleWishlist, pending: favoritePending } =
    useListingFavoriteRow(slug);
  const onSale = originalPrice != null && originalPrice > price;
  const compact = variant === "compact";
  return (
    <div
      className={cn(
        "group flex flex-col rounded-lg bg-white",
        compact && "w-44 shrink-0",
        className,
      )}
    >
      <Link
        to="/$locale/listings/$listingId"
        params={{ locale, listingId: slug }}
        className={cn(
          "relative overflow-hidden bg-neutral-50",
          compact
            ? "aspect-square rounded-md"
            : "aspect-4/3 rounded-t-lg",
        )}
      >
        <img
          src={assetUrl(imageUrl)}
          alt={name}
          width={800}
          height={600}
          sizes={
            compact
              ? "11rem"
              : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          }
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {(promotion || onSale) && (
          <div
            className={cn(
              "pointer-events-none absolute z-10",
              compact ? "left-1.5 top-1.5" : "left-2 top-2",
            )}
          >
            {promotion ? (
              <span
                className={cn(
                  "inline-flex max-w-[min(100%,12rem)] truncate rounded bg-primary font-semibold uppercase tracking-wide text-primary-foreground shadow-sm",
                  compact
                    ? "px-1.5 py-px text-[9px]"
                    : "px-2 py-0.5 text-[10px]",
                )}
              >
                {promotion.badgeLabel}
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex w-fit rounded bg-amber-600 font-semibold uppercase tracking-wide text-white shadow-sm",
                  compact
                    ? "px-1.5 py-px text-[9px]"
                    : "px-2 py-0.5 text-[10px]",
                )}
              >
                {t("listingSale")}
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
          aria-label={
            isFavorite ? t("removeFromFavorites") : t("addToFavorites")
          }
          className={cn(
            "absolute z-10 flex items-center justify-center rounded-full bg-white shadow-sm",
            compact ? "right-1.5 top-1.5 h-7 w-7" : "right-2 top-2 h-8 w-8",
            "transition-[opacity,transform,colors] duration-200 ease-out",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
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
              ? "text-red-600"
              : "text-neutral-500 hover:text-red-600",
          )}
        >
          <Heart
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            strokeWidth={1.75}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </Link>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          compact ? "gap-0.5 pt-2" : "gap-1 pt-3",
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <Link
            to="/$locale/listings/$listingId"
            params={{ locale, listingId: slug }}
            className="min-w-0 flex-1"
          >
            <h3
              className={cn(
                "truncate font-medium leading-tight text-foreground transition-colors hover:text-primary",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {name}
            </h3>
          </Link>
          <div className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
            <span className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <span
                className={cn(
                  "text-muted-foreground line-through",
                  compact ? "text-[10px]" : "text-xs",
                )}
              >
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {!compact && description && (
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {shop && !hideShopLine && (
          <p
            className={cn(
              "truncate text-muted-foreground",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {t("soldBy")}{" "}
            <Link
              to="/$locale/shops/$shopSlug"
              params={{ locale, shopSlug: shop.slug }}
              search={{ page: 1 }}
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {shop.name}
            </Link>
          </p>
        )}

        <StarRating
          rating={rating}
          reviewCount={reviewCount}
          size={compact ? "xs" : "sm"}
          className={compact ? "mt-0.5" : "mt-1"}
        />

        {featureConversations && messageSellerCta ? (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-fit border-border text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground",
              compact
                ? "mt-1.5 h-7 px-2 text-[11px]"
                : "mt-2",
            )}
            asChild
          >
            <Link
              to="/$locale/listings/$listingId"
              params={{ locale, listingId: slug }}
              onClick={(e) => e.stopPropagation()}
            >
              {t("messageSeller")}
            </Link>
          </Button>
        ) : null}

        {featureCartCheckout && onAddToCart ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!defaultVariantId}
            className={cn(
              "w-fit border-border bg-transparent text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground",
              compact
                ? "mt-1.5 h-7 px-2 text-[11px]"
                : "mt-2",
            )}
            onClick={() => defaultVariantId && onAddToCart(defaultVariantId)}
          >
            {t("addToCart")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
