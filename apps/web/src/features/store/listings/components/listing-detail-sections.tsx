import type { Locale } from "@ys/intl";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ListingCard } from "@/features/store/listings/components/listing-card";
import type { AddToCartInput } from "@/features/store/cart/cart.queries";

import { moreFromShopListingsQuery } from "../listings.queries";
import { ListingReviewsSection } from "./listings-reviews-section";

const sectionHeadingClass =
  "mb-4 text-lg font-semibold tracking-tight text-foreground md:text-xl";

const listingRowScrollClassName =
  "-mx-1 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden";

export interface ListingDetailSectionsProps {
  locale: Locale;
  listingSlug: string;
  description: string;
  attributes: { key: string; label: string; displayValue: string }[];
  onAddToCart: (input: AddToCartInput) => void;
}

export function ListingDetailSections({
  locale,
  listingSlug,
  description,
  attributes,
  onAddToCart,
}: ListingDetailSectionsProps) {
  const { data: shopData } = useSuspenseQuery(
    moreFromShopListingsQuery(locale, listingSlug),
  );

  const visibleAttributes = attributes.filter((a) => a.displayValue.trim());

  return (
    <>
      <section className="mt-10">
        <h2 className={sectionHeadingClass}>Description</h2>
        {visibleAttributes.length > 0 && (
          <dl className="mb-8 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
            {visibleAttributes.map((a) => (
              <div key={a.key} className="border-b border-border/70 pb-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {a.label}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{a.displayValue}</dd>
              </div>
            ))}
          </dl>
        )}
        {description.trim() ? (
          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
            {description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No description has been added for this listing yet.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className={sectionHeadingClass}>Reviews</h2>
        <ListingReviewsSection locale={locale} listingSlug={listingSlug} embedded />
      </section>

      <section className="mt-10">
        <h2 className={sectionHeadingClass}>More from this shop</h2>
        {shopData.listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No other listings from this shop right now.
          </p>
        ) : (
          <div className={listingRowScrollClassName}>
            {shopData.listings.map((p) => (
              <ListingCard
                key={p.id}
                variant="compact"
                slug={p.slug}
                defaultVariantId={p.defaultVariantId}
                name={p.name}
                price={p.price}
                originalPrice={p.originalPrice}
                description={p.description}
                imageUrl={p.imageUrl}
                rating={p.rating}
                reviewCount={p.reviewCount}
                shop={p.shop}
                promotion={p.promotion}
                onAddToCart={
                  p.defaultVariantId
                    ? () =>
                        onAddToCart({
                          variantId: p.defaultVariantId!,
                          quantity: 1,
                          listingName: p.name,
                        })
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
