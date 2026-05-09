import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Clock, MapPin, Package, Percent, Star } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ListingCard } from "@/features/store/listings/components/listing-card";
import { DataPagination } from "@/features/shared/data-pagination";
import type { CategorySort } from "@/features/store/category";
import { CategoryCard } from "@/features/store/home/components/category-card";
import { categoriesQuery } from "@/features/store/home";
import { SearchSortToolbar } from "@/features/store/search/components/search-sort-toolbar";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";
import { assetUrl } from "@/lib/api";
import { featureCartCheckout } from "@/lib/features";

import { shopPublicQuery, type ShopPublicResponse } from "./shop.queries";

type ShopPublic = ShopPublicResponse["shop"];

function shopInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function formatMemberSinceCompact(iso: string, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).getFullYear().toString();
  }
}

function ShopReplyTimeLine({ minutes }: { minutes: number }) {
  if (minutes < 60) {
    return (
      <>
        Replies in{" "}
        <span className="font-semibold text-foreground">
          {minutes} min
        </span>
      </>
    );
  }
  const h = Math.max(1, Math.round(minutes / 60));
  if (h === 1) {
    return (
      <>
        Replies in{" "}
        <span className="font-semibold text-foreground">1 hr</span>
      </>
    );
  }
  return (
    <>
      Replies in{" "}
      <span className="font-semibold text-foreground">{h} hrs</span>
    </>
  );
}

function formatCompactReviewCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10}m`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10}k`;
  }
  return String(n);
}

function ShopCatalogHero({
  locale,
  shop,
  page,
  totalPages,
}: {
  locale: Locale;
  shop: ShopPublic;
  page: number;
  totalPages: number;
}) {
  const locationLine = [shop.subcity, shop.city].filter(Boolean).join(" · ") || null;

  return (
    <header className="w-full">
      <div className="flex min-w-0 items-start gap-4 sm:gap-5">
        <div
          className={`size-16 shrink-0 overflow-hidden rounded-sm sm:size-20 md:size-24${shop.imageUrl ? "" : " bg-muted"}`}
        >
          {shop.imageUrl ? (
            <img
              src={assetUrl(shop.imageUrl)}
              alt={`${shop.name} logo`}
              className="size-full object-cover"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground sm:text-base"
              aria-label={`${shop.name} (no logo)`}
            >
              {shopInitials(shop.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 text-foreground">
          <h1 className="font-serif text-2xl font-normal tracking-tight text-foreground md:text-3xl">
            {shop.name}
          </h1>
          {locationLine ? (
            <p className="flex items-center gap-1.5 text-base text-muted-foreground">
              <MapPin className="size-4 shrink-0 opacity-80" />
              <span className="font-semibold text-foreground">{locationLine}</span>
            </p>
          ) : null}
          <dl className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {shop.overallRating != null && shop.reviewCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <Star
                  className="size-4 shrink-0 fill-amber-400 text-amber-400"
                  aria-hidden
                />
                <dt className="sr-only">Overall rating</dt>
                <dd>
                  <span className="font-semibold text-foreground">
                    {shop.overallRating.toFixed(1)}
                  </span>
                  <span>
                    {" "}
                    ({formatCompactReviewCount(shop.reviewCount)})
                  </span>
                </dd>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              <Package className="size-3.5 shrink-0 opacity-80" />
              <dt className="sr-only">Listings</dt>
              <dd>
                <span className="font-semibold text-foreground">{shop.listingCount}</span>
              </dd>
            </div>
            {totalPages > 1 ? (
              <div>
              <dt className="sr-only">Catalog page, current of total</dt>
                <dd>
                  <span className="font-semibold text-foreground">
                    {page}/{totalPages}
                  </span>
                </dd>
              </div>
            ) : null}
            {shop.responseRate != null ? (
              <div className="flex items-center gap-1.5">
                <Percent className="size-3.5 shrink-0 opacity-80" />
                <dt className="sr-only">Response rate</dt>
                <dd>
                  <span className="font-semibold text-foreground">
                    {Math.round(shop.responseRate * 100)}%
                  </span>
                </dd>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 opacity-80" />
              <dt className="sr-only">Reply time</dt>
              <dd>
                <ShopReplyTimeLine minutes={shop.estimatedReplyMinutes} />
              </dd>
            </div>
            <div>
              <dt className="sr-only">On YEJSIRA since</dt>
              <dd>
                Since{" "}
                <span className="font-semibold text-foreground">
                  {formatMemberSinceCompact(shop.createdAt, locale)}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}

const routeApi = getRouteApi("/$locale/(store)/shops/$shopSlug");

export function ShopPage() {
  const { shopSlug, locale: localeParam } = routeApi.useParams();
  const { page, sort } = routeApi.useSearch();
  const locale = localeParam as Locale;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (
    <ShopCatalogPage
      locale={locale}
      shopSlug={shopSlug}
      page={page}
      sort={sort}
      onPageChange={(next) =>
        navigate({
          to: "/$locale/shops/$shopSlug",
          params: { locale, shopSlug },
          search: { page: next, sort },
        })
      }
      onSortChange={(next) =>
        navigate({
          to: "/$locale/shops/$shopSlug",
          params: { locale, shopSlug },
          search: { page: 1, sort: next },
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
  sort,
  onPageChange,
  onSortChange,
  queryClient,
  showShopHero = true,
}: {
  locale: Locale;
  shopSlug: string;
  page: number;
  sort?: CategorySort;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: CategorySort) => void;
  queryClient?: ReturnType<typeof useQueryClient>;
  /** Logo + shop details block above the grid. Hidden on subdomain storefront home (already in ShopHeader). */
  showShopHero?: boolean;
}) {
  const { t } = useTranslation("common");
  const localQueryClient = useQueryClient();
  const addToCart = useMutation(
    addToCartMutationOptions(queryClient ?? localQueryClient, locale),
  );

  const sortValue = sort ?? "relevancy";

  const { data } = useSuspenseQuery(shopPublicQuery(locale, shopSlug, page, 24, sortValue));
  const categoriesQ = useQuery({
    ...categoriesQuery(locale),
    enabled: !showShopHero,
  });

  const { shop, listings, totalPages } = data;

  useEffect(() => {
    document.title = `${shop.name} · YEJSIRA`;
  }, [shop.name]);

  return (
    <main className="pb-12">
      {showShopHero ? (
        <ShopCatalogHero
          locale={locale}
          shop={shop}
          page={page}
          totalPages={totalPages}
        />
      ) : null}

      {!showShopHero && categoriesQ.data?.categories.length ? (
        <section
          className="mb-7 md:hidden"
          aria-labelledby="shop-by-category-heading"
        >
          <h2
            id="shop-by-category-heading"
            className="mb-4 text-lg font-semibold tracking-tight text-foreground"
          >
            {t("shopByCategory")}
          </h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
            {categoriesQ.data.categories.map((category) => (
              <CategoryCard
                key={category.slug}
                name={category.name}
                slug={category.slug}
                imageUrl={category.imageUrl}
                className="w-20 flex-none"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={showShopHero ? "mt-10" : undefined}
        aria-labelledby="shop-featured-heading"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2
            id="shop-featured-heading"
            className="min-w-0 truncate text-xl font-semibold tracking-tight md:text-2xl"
          >
            Featured items
          </h2>
          {onSortChange ? (
            <SearchSortToolbar
              sort={sortValue}
              onSortChange={onSortChange}
              className="shrink-0 py-0 sm:justify-end [&_button]:max-w-[min(58vw,16rem)] sm:[&_button]:max-w-full"
            />
          ) : null}
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
              hideShopLine
              onAddToCart={
                featureCartCheckout && listing.defaultVariantId
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
          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium text-foreground">No featured items yet</p>
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
