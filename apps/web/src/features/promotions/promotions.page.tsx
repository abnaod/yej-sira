import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";

import { ListingCard } from "@/components/ui/listing-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";

import { promotionDetailQuery } from "./promotions.queries";

const routeApi = getRouteApi("/$locale/(store)/promotions/$slug");

export function PromotionPage() {
  const { slug, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const queryClient = useQueryClient();
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  const { data } = useSuspenseQuery(promotionDetailQuery(locale, slug));
  const { promotion, listings, total } = data;

  return (
    <main>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {promotion.active ? promotion.badgeLabel : "Promotion"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{promotion.title}</h1>
        {promotion.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{promotion.subtitle}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}
          {promotion.active && (
            <>
              {" "}
              · Ends {new Date(promotion.endsAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </>
          )}
        </p>
        {!promotion.active && (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            This promotion has ended. Prices shown are current list prices.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            slug={listing.slug}
            defaultVariantId={listing.defaultVariantId}
            name={listing.name}
            price={listing.price}
            originalPrice={listing.originalPrice}
            description={listing.description}
            imageUrl={listing.imageUrl}
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            shop={listing.shop}
            promotion={listing.promotion}
            onAddToCart={
              listing.defaultVariantId
                ? () =>
                    addToCart.mutate({
                      variantId: listing.defaultVariantId!,
                      quantity: 1,
                      listingName: listing.name,
                    })
                : undefined
            }
          />
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        <Link
          to="/$locale"
          params={{ locale }}
          className="font-medium text-primary underline underline-offset-4"
        >
          Back to home
        </Link>
      </p>
    </main>
  );
}
