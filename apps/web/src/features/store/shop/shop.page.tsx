import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Percent,
  Phone,
  Share2,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ListingCard } from "@/features/store/listings/components/listing-card";
import { DataPagination } from "@/features/shared/data-pagination";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";
import { assetUrl } from "@/lib/api";
import { featureCartCheckout, featureConversations } from "@/lib/features";
import { cn } from "@/lib/utils";

import type { ShopSocialLinks } from "./shop.queries";
import { shopPublicQuery } from "./shop.queries";

const routeApi = getRouteApi("/$locale/(store)/shops/$shopSlug");

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

function contactHrefPhone(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? `tel:${digits}` : `tel:${digits}`;
}

type SocialKey = "telegram" | "whatsapp" | "instagram" | "facebook" | "tiktok" | "website";

const SOCIAL_LABELS: Record<SocialKey, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Website",
};

function SocialLinksRow({ links }: { links: ShopSocialLinks | null }) {
  if (!links) return null;
  const items = (Object.keys(SOCIAL_LABELS) as SocialKey[])
    .map((k) => {
      const url = links[k]?.trim();
      if (!url) return null;
      return { key: k, url, label: SOCIAL_LABELS[k] };
    })
    .filter((x): x is { key: SocialKey; url: string; label: string } => x != null);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, url, label }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xss font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
        >
          {label}
          <ExternalLink className="size-3 opacity-70" />
        </a>
      ))}
    </div>
  );
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

  const accent = shop.accentColor?.trim() || null;

  const locationLine = [shop.subcity, shop.city].filter(Boolean).join(" · ") || null;

  const onShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: shop.name, text: shop.name, url });
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }, [shop.name]);

  useEffect(() => {
    document.title = `${shop.name} · YEJSIRA`;
  }, [shop.name]);

  return (
    <main className="pb-12">
      <header className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
        <div
          className={cn(
            "relative h-36 w-full sm:h-44",
            !shop.bannerImageUrl && "bg-muted",
          )}
          style={
            !shop.bannerImageUrl && accent
              ? { background: `linear-gradient(135deg, ${accent}33 0%, var(--card) 100%)` }
              : undefined
          }
        >
          {shop.bannerImageUrl ? (
            <img
              src={assetUrl(shop.bannerImageUrl)}
              alt=""
              className="size-full object-cover"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 to-transparent"
            aria-hidden
          />
        </div>

        {/* Identity sits below the banner in the card body so label + name stay on a light, readable surface. Only the logo may overlap the banner. */}
        <div className="relative border-t border-border/80 bg-card px-5 pb-6 pt-5 sm:px-8 sm:pt-6 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex shrink-0 justify-center sm:justify-start sm:-mt-10">
              <div className="size-24 overflow-hidden rounded-2xl border-4 border-card bg-card shadow-sm sm:size-28">
                {shop.imageUrl ? (
                  <img
                    src={assetUrl(shop.imageUrl)}
                    alt={`${shop.name} logo`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div
                    className="flex size-full items-center justify-center bg-muted/80 text-2xl font-medium text-muted-foreground"
                    aria-label={`${shop.name} (no logo)`}
                  >
                    {shopInitials(shop.name)}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-3 sm:pt-0">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Shop
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h1 className="font-serif text-2xl font-normal tracking-tight text-foreground md:text-3xl">
                    {shop.name}
                  </h1>
                  {locationLine ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      {locationLine}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => void onShare()}
                  >
                    <Share2 className="size-3.5" />
                    Share
                  </Button>
                </div>
              </div>

              <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Package className="size-3.5 shrink-0" />
                  <dt className="sr-only">Listings</dt>
                  <dd>
                    <span className="font-medium text-foreground">{shop.listingCount}</span>{" "}
                    {shop.listingCount === 1 ? "listing" : "listings"}
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
                {shop.responseRate != null ? (
                  <div className="flex items-center gap-1.5">
                    <Percent className="size-3.5 shrink-0" />
                    <dt className="sr-only">Response rate</dt>
                    <dd>
                      <span className="font-medium text-foreground">
                        {Math.round(shop.responseRate * 100)}%
                      </span>{" "}
                      response rate
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" />
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

          {shop.description ? (
            <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:mt-8">
              {shop.description}
            </p>
          ) : (
            <p className="mt-6 text-sm italic text-muted-foreground sm:mt-8">
              This seller has not added a description yet.
            </p>
          )}

          {(shop.contactEmail ||
            shop.contactPhone ||
            (shop.socialLinks && Object.keys(shop.socialLinks).length > 0)) && (
            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contact
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {shop.contactEmail ? (
                  <a
                    href={`mailto:${shop.contactEmail}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <Mail className="size-3.5 text-muted-foreground" />
                    {shop.contactEmail}
                  </a>
                ) : null}
                {shop.contactPhone ? (
                  <a
                    href={contactHrefPhone(shop.contactPhone)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    <Phone className="size-3.5 text-muted-foreground" />
                    {shop.contactPhone}
                  </a>
                ) : null}
              </div>
              <SocialLinksRow links={shop.socialLinks} />
            </div>
          )}

          {featureConversations ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Open a product to message this seller in chat — that&apos;s how most orders start
              here.
            </p>
          ) : null}
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
