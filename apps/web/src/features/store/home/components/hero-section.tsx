import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { promotionsListQuery } from "@/features/store/promotions/promotions.queries";
import { assetUrl } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";

/** Small business / retail — seller-focused hero (served from /public/storefront). */
const sellerHeroImage = "/static/storefront/hero-seller.jpg";
/** Fallback when no active promotion from API. */
const fallbackDealImage = "/static/storefront/hero-fallback.jpg";

export function HeroSection() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const { data } = useQuery({ ...promotionsListQuery(locale), staleTime: 60_000 });
  const promo = data?.promotions[0];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-stretch">
      {/* Primary: split text + image */}
      <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm sm:flex-row">
        <div className="flex w-full flex-col items-center justify-center bg-linear-to-r from-neutral-100 to-neutral-50 px-6 py-5 text-center sm:w-3/5 sm:py-6 md:px-10">
          <h1 className="max-w-[22ch] font-serif text-2xl font-normal leading-snug tracking-tight text-foreground sm:max-w-[26ch] sm:text-3xl md:text-4xl">
            {t("heroSellerTitle")}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("heroSellerSubtitle")}
          </p>
          <Button
            asChild
            variant="default"
            size="lg"
            className="mt-4 rounded-full px-8 text-sm font-normal sm:mt-5"
          >
            <Link to="/$locale/sell" params={{ locale }}>
              {t("openShop")}
            </Link>
          </Button>
        </div>
        <div className="relative min-h-32 w-full min-w-0 sm:min-h-0 sm:w-2/5">
          <img
            src={assetUrl(sellerHeroImage)}
            alt="Artisan hands carving a traditional clay jebena outdoors — handmade pottery"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Secondary: active promotion from API, or search fallback */}
      <div className="relative min-h-32 overflow-hidden rounded-2xl shadow-sm sm:min-h-0">
        <img
          src={assetUrl(promo?.heroImageUrl ?? fallbackDealImage)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 max-w-[95%] p-4 text-white sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/90">
            {promo?.badgeLabel ?? t("heroDiscoverBadge")}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug sm:text-lg">
            {promo?.title ?? t("heroDiscoverFallbackTitle")}
          </p>
          {promo?.subtitle && (
            <p className="mt-1 text-sm text-white/90">{promo.subtitle}</p>
          )}
          {promo ? (
            <Link
              to="/$locale/promotions/$slug"
              params={{ locale, slug: promo.slug }}
              className="mt-2 inline-block text-sm font-medium text-white underline underline-offset-4 transition-opacity hover:opacity-90"
            >
              {t("heroShopPromotion")}
            </Link>
          ) : (
            <Link
              to="/$locale/search"
              params={{ locale }}
              search={{
                q: "handmade",
                sort: "relevancy",
                tagSlugs: "",
                promotionSlug: undefined,
              }}
              className="mt-2 inline-block text-sm font-medium text-white underline underline-offset-4 transition-opacity hover:opacity-90"
            >
              {t("heroBrowseHandmade")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
