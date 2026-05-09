import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ListingCard } from "@/features/store/listings/components/listing-card";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";
import { useLocale } from "@/lib/locale-path";

import { FEATURED_LISTINGS_LIMIT, featuredListingsQuery } from "../home.queries";

export function FeaturedSection() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(featuredListingsQuery(locale, FEATURED_LISTINGS_LIMIT));

  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        {t("popularPicks")}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-6 sm:mt-5 sm:grid-cols-3 lg:grid-cols-4">
        {data.listings.map((listing) => (
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
    </section>
  );
}
