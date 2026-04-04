import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

export interface RatingSummaryProps {
  average: number;
  total: number;
  /** Index `i` = `i + 1` stars (e.g. `[0]` = 1-star count). */
  counts: [number, number, number, number, number];
  className?: string;
}

export function RatingSummary({
  average,
  total,
  counts,
  className,
}: RatingSummaryProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[280px] space-y-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <StarRating rating={average} size="md" />
        <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
          {average.toFixed(1)}
        </span>
      </div>
      <div className="border-b border-border" />
      <ul className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <li
              key={star}
              className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-3"
              aria-label={`${star} star${star === 1 ? "" : "s"}: ${count} out of ${total} reviews`}
            >
              <span className="text-sm text-muted-foreground tabular-nums">{star}</span>
              <div className="min-w-0" aria-hidden>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-rating transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="min-w-[2ch] text-right text-sm font-bold tabular-nums text-foreground">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
