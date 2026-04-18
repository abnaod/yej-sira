import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "@tanstack/react-router";
import type { Locale } from "@ys/intl";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuthDialog } from "@/features/shared/auth";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { assetUrl } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { myShopQuery } from "../shared/shop.queries";

/** Category mosaic (tall cells at 0 and 3). */
const CATEGORY_MOSAIC_FILES = [
  "pottery.jpg",
  "jewelry.jpg",
  "basketry.jpg",
  "clothing.jpg",
  "art-collectibles.jpg",
  "crochet.jpg",
] as const;

const ctaButtonClass =
  "h-14 min-h-14 rounded-full px-10 text-base font-medium sm:h-16 sm:min-h-16 sm:px-12 sm:text-lg";

export function SellerLandingPage() {
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const { openAuth } = useAuthDialog();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  // Client-side shop check for hard-refresh scenarios.
  // beforeLoad already handles client-side navigations, but during SSR it
  // can't send session cookies so the fetch fails. After hydration,
  // beforeLoad does NOT re-run, so the component must handle the redirect.
  const shopQuery = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });

  // While session or shop ownership is undetermined, render nothing.
  if (sessionPending || (!!session?.user && shopQuery.isLoading)) {
    return null;
  }

  // User has a shop — redirect to dashboard (declarative, no useEffect).
  if (shopQuery.data?.shop) {
    return <Navigate to="/$locale/sell/dashboard" params={{ locale }} />;
  }

  const getStartedLabel = t("sellerGetStarted");
  const primaryCta = !sessionPending &&
    (session?.user ? (
      <Button size="lg" className={ctaButtonClass} asChild>
        <Link to="/$locale/sell/register" params={{ locale }}>
          {getStartedLabel}
        </Link>
      </Button>
    ) : (
      <Button
        size="lg"
        type="button"
        className={ctaButtonClass}
        onClick={() => openAuth({ redirectToSellerPortal: true })}
      >
        {getStartedLabel}
      </Button>
    ));

  return (
    <div className="bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/$locale" params={{ locale }} className="flex shrink-0 items-center">
            <BrandLogo className="text-primary" />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {!sessionPending && !session?.user && (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="rounded-full"
                onClick={() => openAuth({ redirectToSellerPortal: true })}
              >
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden pb-16 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:px-6 md:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Store className="size-3.5 text-primary" aria-hidden />
              Open your Yej Sira shop
            </div>
            <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Thousands of shoppers can&apos;t wait to see what you have in store.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Join the creative marketplace where makers across Ethiopia sell directly to people who love how
              things are made.
            </p>
            <div className="mt-10">{primaryCta}</div>
          </div>
          <CategoryMosaicGrid />
        </div>
      </section>
    </div>
  );
}

function CategoryMosaicGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {CATEGORY_MOSAIC_FILES.map((file, i) => (
        <div
          key={file}
          className={`relative overflow-hidden rounded-2xl bg-muted ${
            i === 0 || i === 3 ? "aspect-3/4" : "aspect-square"
          }`}
        >
          <img
            src={assetUrl(`/static/categories/${file}`)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
