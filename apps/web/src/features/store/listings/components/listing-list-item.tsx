import { Link } from "@tanstack/react-router";

import { assetUrl } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/features/shared/formatters";
import { StarRating } from "@/features/shared/star-rating";

interface ListingListItemProps {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  className?: string;
}

export function ListingListItem({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  rating,
  reviewCount,
  className,
}: ListingListItemProps) {
  const locale = useLocale();
  const content = (
    <>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
        <img
          src={assetUrl(imageUrl)}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-foreground">
          {name}
        </h4>
      </div>

      <StarRating rating={rating} reviewCount={reviewCount} />

      <div className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="text-sm font-semibold">{formatMoney(price)}</span>
        {originalPrice && (
          <span className="text-xs text-muted-foreground line-through">
            {formatMoney(originalPrice)}
          </span>
        )}
      </div>
    </>
  );

  const sharedClassName = cn(
    "flex items-center gap-4 rounded-lg border border-border bg-white px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
    className,
  );

  if (id) {
    return (
      <Link
        to="/$locale/listings/$listingId"
        params={{ locale, listingId: id }}
        className={sharedClassName}
      >
        {content}
      </Link>
    );
  }

  return <div className={sharedClassName}>{content}</div>;
}
