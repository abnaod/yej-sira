import { cn } from "@/lib/utils";

/** Soft light-gray surface when the shop has no banner photo. */
export const SHOP_HERO_FALLBACK_LAYER_CLASS = cn(
  "absolute inset-0 size-full bg-linear-to-br",
  "from-muted via-background to-muted",
);

/** Barely-there depth so the block isn’t a flat slab. */
export const SHOP_HERO_FALLBACK_SHEEN_CLASS = cn(
  "pointer-events-none absolute inset-0",
  "bg-[radial-gradient(ellipse_78%_58%_at_88%_10%,rgba(15,23,42,0.045),transparent_55%)]",
);

export function ShopHeroFallbackSurface({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0", className)} aria-hidden>
      <div className={SHOP_HERO_FALLBACK_LAYER_CLASS} />
      <div className={SHOP_HERO_FALLBACK_SHEEN_CLASS} />
    </div>
  );
}
