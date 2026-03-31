import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  reviewCount,
  size = "sm",
  className,
}: StarRatingProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < rating;

          return (
            <Star
              key={i}
              className={cn(
                starSize,
                filled
                  ? "fill-rating text-rating"
                  : half
                    ? "fill-rating/50 text-rating"
                    : "fill-neutral-200 text-neutral-200",
              )}
            />
          );
        })}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      )}
    </div>
  );
}
