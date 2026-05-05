import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ListingCard } from "@/features/store/listings/components/listing-card";
import { DataPagination } from "@/features/shared/data-pagination";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";

import { shopPublicQuery } from "./shop.queries";

const routeApi = getRouteApi("/$locale/(store)/shops/$shopSlug");

export function ShopPage() {
  const { shopSlug, locale: localeParam } = routeApi.useParams();
  const { page } = routeApi.useSearch();
  const locale = localeParam as Locale;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (
    <ShopCatalogPage
      locale={locale}
      shopSlug={shopSlug}
      page={page}
      onPageChange={(next) =>
        navigate({
          to: "/$locale/shops/$shopSlug",
          params: { locale, shopSlug },
          search: { page: next },
        })
      }
      queryClient={queryClient}
    />
  );
}

export function ShopCatalogPage({
  locale,
  shopSlug,
  page,
  onPageChange,
  queryClient,
}: {
  locale: Locale;
  shopSlug: string;
  page: number;
  onPageChange?: (page: number) => void;
  queryClient?: ReturnType<typeof useQueryClient>;
}) {
  const localQueryClient = useQueryClient();
  const addToCart = useMutation(
    addToCartMutationOptions(queryClient ?? localQueryClient, locale),
  );

  const { data } = useSuspenseQuery(shopPublicQuery(locale, shopSlug, page));

  const { shop, listings, total, totalPages } = data;

  useEffect(() => {
    const docTitle = `${shop.name} · YEJSIRA`;
    document.title = docTitle;
    if (import.meta.env.DEV) {
      // Helps verify the visible page heading matches the document title in devtools.
      console.log("[ShopPage] heading:", shop.name);
    }
  }, [shop.name]);

  return (
    <main className="pb-6 md:pb-12">
      <h1 className="sr-only">{shop.name}</h1>

      <section aria-labelledby="shop-products-heading">
        <div className="mb-4 flex flex-col gap-1 md:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="shop-products-heading" className="text-base font-semibold tracking-tight md:text-lg">
              Products
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {total === 0
                ? "No listings yet"
                : `${total} ${total === 1 ? "listing" : "listings"}`}
              {totalPages > 1 ? (
                <>
                  {" · "}
                  Page {page} of {totalPages}
                </>
              ) : null}
            </p>
          </div>
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
          <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium text-foreground">No products listed yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon or browse other shops from the home page.
            </p>
            <Button className="mt-6" variant="outline" size="sm" asChild>
              <Link to="/$locale" params={{ locale }}>
                Back to home
              </Link>
            </Button>
          </div>
        ) : null}

        {onPageChange ? (
          <DataPagination
            className="mt-10"
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        ) : null}
      </section>
    </main>
  );
}
