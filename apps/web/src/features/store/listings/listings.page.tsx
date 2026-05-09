import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ListingCard } from "@/features/store/listings/components/listing-card";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";
import { useListingFavoriteRow } from "@/features/store/favorites/hooks/use-listing-favorite-row";
import { listingDetailQuery, relatedListingsQuery } from "./listings.queries";

import { BuyBox } from "./components/buy-box";
import { ListingDetailSections } from "./components/listing-detail-sections";
import { ListingGallery } from "./components/listings-gallery";

const routeApi = getRouteApi("/$locale/(store)/listings/$listingId");

export function ListingPage() {
  const { listingId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const { data: listingData } = useSuspenseQuery(listingDetailQuery(locale, listingId));
  const { data: relatedData, isPending: relatedPending, isError: relatedError } = useQuery(
    relatedListingsQuery(locale, listingId),
  );

  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));
  const favorite = useListingFavoriteRow(listingData.listing.slug);

  const { listing } = listingData;

  const breadcrumbItems = [
    {
      label: listing.category.name,
      to: "/$locale/categories/$categoryId",
      params: { locale, categoryId: listing.category.slug },
      search: {
        sort: "relevancy",
        tagSlugs: "",
        promotionSlug: undefined,
        attributeDefinitionKey: undefined,
        allowedValueKey: undefined,
      },
    },
    { label: listing.name },
  ];

  return (
    <main>
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="grid gap-8 lg:grid-cols-2">
        <ListingGallery images={listing.images} listingName={listing.name} />

        <BuyBox
          listingId={listing.id}
          messageSellerDisabled={listing.isViewerShopOwner}
          name={listing.name}
          shop={listing.shop}
          financingNote="Suggested payments with 6 months special financing"
          rating={listing.rating}
          reviewCount={listing.reviewCount}
          promotion={listing.promotion}
          variants={listing.variants.map((v) => ({
            id: v.id,
            label: v.label,
            colorHex: v.colorHex ?? undefined,
            price: v.price,
            stock: v.stock,
          }))}
          onAddToCart={(payload) => addToCart.mutate(payload)}
          onBuyNow={async (payload) => {
            await addToCart.mutateAsync(payload);
            void navigate({ to: "/$locale/checkout", params: { locale } });
          }}
          isFavorite={favorite.isFavorite}
          onToggleFavorite={favorite.onToggleWishlist}
          favoritePending={favorite.pending}
        />
      </div>

      <ListingDetailSections
        locale={locale}
        listingSlug={listingId}
        description={listing.description}
        attributes={listing.attributes}
        onAddToCart={(input) => addToCart.mutate(input)}
      />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground md:text-xl">
          Related Listings
        </h2>
        {relatedPending ? (
          <p className="text-sm text-muted-foreground">Loading related listings…</p>
        ) : relatedError ? (
          <p className="text-sm text-muted-foreground">Related listings are unavailable.</p>
        ) : relatedData.listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No related listings right now.</p>
        ) : (
          <div
            className="-mx-1 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
          >
            {relatedData.listings.map((p) => (
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
                        addToCart.mutate({
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
    </main>
  );
}
