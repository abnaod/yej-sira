import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ListingCard } from "@/components/ui/listing-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { shopPublicQuery } from "./shop.queries";

const routeApi = getRouteApi("/$locale/(store)/shops/$shopSlug");

export function ShopPage() {
  const { shopSlug, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const queryClient = useQueryClient();
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  const { data } = useSuspenseQuery(shopPublicQuery(locale, shopSlug));

  const { shop, listings } = data;

  return (
    <main>
      <header className="border-b border-border pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              {shop.name}
            </h1>
            {shop.description ? (
              <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">{shop.description}</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 sm:mt-10 sm:grid-cols-3 lg:grid-cols-4">
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
            promotion={listing.promotion}
            shop={listing.shop}
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

      {listings.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No listings listed yet.</p>
      ) : null}
    </main>
  );
}
