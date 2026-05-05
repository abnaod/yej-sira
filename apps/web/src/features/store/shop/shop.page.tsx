import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Clock, MapPin, Package, Percent, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ListingCard } from "@/features/store/listings/components/listing-card";
import { DataPagination } from "@/features/shared/data-pagination";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";
import { assetUrl } from "@/lib/api";
import { featureCartCheckout, featureConversations } from "@/lib/features";
import { cn } from "@/lib/utils";

import { ShopHeroFallbackSurface } from "./shop-hero-fallback";
import { shopPublicQuery, type ShopPublicResponse } from "./shop.queries";

type ShopPublic = ShopPublicResponse["shop"];

function shopInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function formatMemberSince(iso: string, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", {
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).getFullYear().toString();
  }
}

function formatReplyText(minutes: number): string {
  if (minutes < 60) {
    return `Usually replies within ${minutes} min`;
  }
  const h = Math.max(1, Math.round(minutes / 60));
  return h === 1 ? "Usually replies within 1 hour" : `Usually replies within ${h} hours`;
}

function ShopCatalogHero({
  locale,
  shopSlug,
  shop,
  page,
  totalPages,
}: {
  locale: Locale;
  shopSlug: string;
  shop: ShopPublic;
  page: number;
  totalPages: number;
}) {
  const customBanner = shop.bannerImageUrl?.trim() ?? "";
  const [customBannerFailed, setCustomBannerFailed] = useState(false);
  useEffect(() => {
    setCustomBannerFailed(false);
  }, [customBanner]);
  const showBannerPhoto = Boolean(customBanner && !customBannerFailed);
  const locationLine = [shop.subcity, shop.city].filter(Boolean).join(" · ") || null;

  const onShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const shareUrl = new URL(
      `/${locale}/shops/${encodeURIComponent(shopSlug)}`,
      window.location.origin,
    ).href;
    const shareData: ShareData = { title: shop.name, text: shop.name, url: shareUrl };

    if (typeof navigator.share === "function") {
      const can =
        typeof navigator.canShare !== "function" || navigator.canShare(shareData);
      if (can) {
        try {
          await navigator.share(shareData);
          return;
        } catch (e) {
          const isAbort =
            (e instanceof DOMException || e instanceof Error) && e.name === "AbortError";
          if (isAbort) return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }, [locale, shop.name, shopSlug]);

  return (
    <header className="overflow-hidden rounded-lg border border-border">
      <div className="relative flex min-h-44 w-full flex-col justify-end sm:min-h-52">
        {showBannerPhoto ? (
          <img
            src={assetUrl(customBanner)}
            alt=""
            className="absolute inset-0 size-full object-cover"
            onError={() => {
              setCustomBannerFailed(true);
            }}
          />
        ) : (
          <ShopHeroFallbackSurface />
        )}
        {showBannerPhoto ? (
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/92 via-black/55 to-black/10"
            aria-hidden
          />
        ) : null}
        <div
          className={cn(
            "relative z-10 flex flex-col gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5 sm:px-6 sm:pt-5 sm:pb-4",
            showBannerPhoto ? "text-white" : "text-foreground",
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <div
              className={cn(
                "shrink-0 rounded-lg border p-2 shadow-sm backdrop-blur-sm sm:p-2.5",
                showBannerPhoto
                  ? "border-white/25 bg-black/35"
                  : "border-border bg-card/95",
              )}
            >
              {shop.imageUrl ? (
                <img
                  src={assetUrl(shop.imageUrl)}
                  alt={`${shop.name} logo`}
                  className="size-10 rounded-md object-cover sm:size-12"
                />
              ) : (
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md text-xs font-semibold sm:size-12 sm:text-sm",
                    showBannerPhoto
                      ? "bg-white/15 text-white/90"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-label={`${shop.name} (no logo)`}
                >
                  {shopInitials(shop.name)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-col gap-0.5">
                <p
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-widest",
                    showBannerPhoto ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  Shop
                </p>
                <h1
                  className={cn(
                    "font-serif text-2xl font-normal tracking-tight md:text-3xl",
                    showBannerPhoto ? "text-white" : "text-foreground",
                  )}
                >
                  {shop.name}
                </h1>
              </div>
              {locationLine ? (
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm",
                    showBannerPhoto ? "text-white/80" : "text-muted-foreground",
                  )}
                >
                  <MapPin className="size-3.5 shrink-0 opacity-80" />
                  {locationLine}
                </p>
              ) : null}
              <dl
                className={cn(
                  "flex flex-wrap gap-x-4 gap-y-1.5 text-xs",
                  showBannerPhoto ? "text-white/75" : "text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Package className="size-3 shrink-0 opacity-80" />
                  <dt className="sr-only">Listings</dt>
                  <dd>
                    <span
                      className={cn(
                        "font-medium",
                        showBannerPhoto ? "text-white" : "text-foreground",
                      )}
                    >
                      {shop.listingCount}
                    </span>{" "}
                    {shop.listingCount === 1 ? "listing" : "listings"}
                  </dd>
                </div>
                {totalPages > 1 ? (
                  <div>
                    <dt className="sr-only">Catalog page</dt>
                    <dd>
                      Page{" "}
                      <span
                        className={cn(
                          "font-medium",
                          showBannerPhoto ? "text-white" : "text-foreground",
                        )}
                      >
                        {page} of {totalPages}
                      </span>
                    </dd>
                  </div>
                ) : null}
                {shop.responseRate != null ? (
                  <div className="flex items-center gap-1.5">
                    <Percent className="size-3 shrink-0 opacity-80" />
                    <dt className="sr-only">Response rate</dt>
                    <dd>
                      <span
                        className={cn(
                          "font-medium",
                          showBannerPhoto ? "text-white" : "text-foreground",
                        )}
                      >
                        {Math.round(shop.responseRate * 100)}%
                      </span>{" "}
                      response rate
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3 shrink-0 opacity-80" />
                  <dt className="sr-only">Reply time</dt>
                  <dd>{formatReplyText(shop.estimatedReplyMinutes)}</dd>
                </div>
                <div>
                  <dt className="sr-only">On YEJSIRA since</dt>
                  <dd>Member since {formatMemberSince(shop.createdAt, locale)}</dd>
                </div>
              </dl>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 self-start sm:self-auto",
              showBannerPhoto &&
                "border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white",
            )}
            onClick={() => void onShare()}
          >
            <Share2 className="size-3.5" />
            Share
          </Button>
        </div>
      </div>
    </header>
  );
}

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
  showShopHero = true,
}: {
  locale: Locale;
  shopSlug: string;
  page: number;
  onPageChange?: (page: number) => void;
  queryClient?: ReturnType<typeof useQueryClient>;
  /** Banner + shop details block above the grid. Hidden on subdomain storefront home (already in ShopHeader). */
  showShopHero?: boolean;
}) {
  const localQueryClient = useQueryClient();
  const addToCart = useMutation(
    addToCartMutationOptions(queryClient ?? localQueryClient, locale),
  );

  const { data } = useSuspenseQuery(shopPublicQuery(locale, shopSlug, page));

  const { shop, listings, total, totalPages } = data;

  useEffect(() => {
    document.title = `${shop.name} · YEJSIRA`;
  }, [shop.name]);

  return (
    <main className="pb-12">
      {showShopHero ? (
        <ShopCatalogHero
          locale={locale}
          shopSlug={shopSlug}
          shop={shop}
          page={page}
          totalPages={totalPages}
        />
      ) : null}

      <section
        className={showShopHero ? "mt-10" : undefined}
        aria-labelledby="shop-products-heading"
      >
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
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
              hideShopLine
              messageSellerCta={featureConversations}
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
