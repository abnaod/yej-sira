import { Link } from "@tanstack/react-router";

import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";

interface ProductListItemProps {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  className?: string;
}

export function ProductListItem({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  rating,
  reviewCount,
  className,
}: ProductListItemProps) {
  const locale = useLocale();
  const content = (
    <>
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
        <img
          src={imageUrl}
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
        <span className="text-sm font-semibold">${price.toFixed(2)}</span>
        {originalPrice && (
          <span className="text-xs text-muted-foreground line-through">
            ${originalPrice.toFixed(2)}
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
        to="/$locale/products/$productId"
        params={{ locale, productId: id }}
        className={sharedClassName}
      >
        {content}
      </Link>
    );
  }

  return <div className={sharedClassName}>{content}</div>;
}
