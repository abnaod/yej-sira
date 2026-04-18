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

function shopInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function ShopPage() {
  const { shopSlug, locale: localeParam } = routeApi.useParams();
  const { page } = routeApi.useSearch();
  const locale = localeParam as Locale;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

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
    <main className="pb-12">
      <header className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-card">
        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Shop
          </p>

          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-card sm:size-24">
              {shop.imageUrl ? (
                <img
                  src={shop.imageUrl}
                  alt={`${shop.name} logo`}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  className="flex size-full items-center justify-center bg-muted/60 text-lg font-medium text-muted-foreground"
                  aria-label={`${shop.name} (no logo)`}
                >
                  {shopInitials(shop.name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="space-y-1.5">
                <h1 className="font-serif text-xl font-normal tracking-tight text-foreground md:text-2xl">
                  {shop.name}
                </h1>
                {shop.description ? (
                  <p className="max-w-2xl text-muted-foreground leading-relaxed">{shop.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    This seller has not added a description yet.
                  </p>
                )}
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div>
                  <dt className="sr-only">Total products</dt>
                  <dd>
                    <span className="font-medium text-foreground">{total}</span>{" "}
                    {total === 1 ? "product" : "products"}
                  </dd>
                </div>
                {totalPages > 1 ? (
                  <div>
                    <dt className="sr-only">Catalog page</dt>
                    <dd>
                      Page{" "}
                      <span className="font-medium text-foreground">
                        {page} of {totalPages}
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="shop-products-heading">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="shop-products-heading" className="text-lg font-semibold tracking-tight">
              Products
            </h2>
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "No listings yet"
                : `${total} ${total === 1 ? "listing" : "listings"} from this shop`}
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

        <DataPagination
          className="mt-10"
          page={page}
          totalPages={totalPages}
          onPageChange={(next) =>
            navigate({
              to: "/$locale/shops/$shopSlug",
              params: { locale, shopSlug },
              search: { page: next },
            })
          }
        />
      </section>
    </main>
  );
}
