import { Link, Outlet, getRouteApi } from "@tanstack/react-router";
import { Heart, Store, User } from "lucide-react";

import { BottomNav, MobileBottomNavScrollSpacer } from "@/components/layout/bottom-nav";
import { ContentContainer } from "@/components/layout/content-container";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer/footer";
import { Header } from "@/components/layout/header/header";
import { HeaderFilter } from "@/components/layout/header/header-filter";
import { HeaderNav } from "@/components/layout/header/header-nav";
import { HeaderSearch } from "@/components/layout/header/header-search";
import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/features/shared/auth";
import { assetUrl } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import { StorefrontTenantProvider } from "@/lib/storefront-context";
import { marketplaceUrl } from "@/lib/storefront";
import type { PublicStorefrontShop } from "@/lib/storefront";

const routeApi = getRouteApi("/$locale/(store)");

/** Storefront chrome: header, constrained content, footer. Used only under `/$locale/(store)/...`. */
export function StoreLayout() {
  const tenant = routeApi.useLoaderData();

  if (tenant.context.isStorefront && !tenant.shop) {
    return (
      <StorefrontTenantProvider value={tenant}>
        <div className="flex min-h-dvh flex-col">
          <UnavailableStorefront />
        </div>
      </StorefrontTenantProvider>
    );
  }

  if (tenant.context.isStorefront && tenant.shop) {
    return (
      <StorefrontTenantProvider value={tenant}>
        <div className="flex min-h-dvh flex-col">
          <ShopHeader shop={tenant.shop} />
          <ContentContainer>
            <Outlet />
          </ContentContainer>
          <ShopFooter shop={tenant.shop} />
          <MobileBottomNavScrollSpacer />
        </div>
        <BottomNav variant="shop" />
      </StorefrontTenantProvider>
    );
  }

  return (
    <StorefrontTenantProvider value={tenant}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <ContentContainer>
          <Outlet />
        </ContentContainer>
        <Footer />
        <MobileBottomNavScrollSpacer />
        <CookieBanner />
      </div>
      <BottomNav variant="marketplace" />
    </StorefrontTenantProvider>
  );
}

type PublicShop = PublicStorefrontShop;

function shopInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function ShopLogo({ shop }: { shop: PublicShop }) {
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm text-sm font-semibold${shop.imageUrl ? "" : " bg-muted"}`}
    >
      {shop.imageUrl ? (
        <img
          src={assetUrl(shop.imageUrl)}
          alt={`${shop.name} logo`}
          className="size-full object-cover"
        />
      ) : (
        <span>{shopInitials(shop.name)}</span>
      )}
    </div>
  );
}

function ShopHeader({ shop }: { shop: PublicShop }) {
  const locale = useLocale();
  const { openAuth } = useAuthDialog();

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex min-w-0 shrink-0 items-center gap-2"
        >
          <ShopLogo shop={shop} />
          <span className="max-w-36 truncate text-sm font-semibold text-foreground sm:max-w-52">
            {shop.name}
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <HeaderNav />
          <div className="flex min-w-0 flex-1 items-center gap-0">
            <HeaderFilter />
            <HeaderSearch />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-1.5 py-1 text-sm font-normal text-foreground hover:text-primary"
            onClick={() => openAuth()}
            aria-label="Account"
          >
            <User className="h-4 w-4" />
          </Button>
          <Link
            to="/$locale/favorites"
            params={{ locale }}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-foreground transition-colors hover:text-primary"
            aria-label="Favorites"
          >
            <Heart className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ShopFooter({ shop }: { shop: PublicShop }) {
  const locale = useLocale();
  const year = new Date().getFullYear();
  const marketplaceHref = marketplaceUrl(`/${locale}`);

  return (
    <footer className="hidden border-t border-border bg-primary text-primary-foreground md:block">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShopLogo shop={shop} />
            <span className="font-semibold">{shop.name}</span>
          </div>
          {shop.description ? (
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/80">
              {shop.description}
            </p>
          ) : null}
          <p className="text-xs text-primary-foreground/70">Powered by YEJSIRA</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <h3 className="font-semibold">Contact</h3>
          {shop.contactEmail ? (
            <a
              className="text-primary-foreground/80 hover:text-primary-foreground"
              href={`mailto:${shop.contactEmail}`}
            >
              {shop.contactEmail}
            </a>
          ) : null}
          {shop.contactPhone ? (
            <a
              className="text-primary-foreground/80 hover:text-primary-foreground"
              href={`tel:${shop.contactPhone}`}
            >
              {shop.contactPhone}
            </a>
          ) : null}
          {!shop.contactEmail && !shop.contactPhone ? (
            <span className="text-primary-foreground/70">Contact details coming soon</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <h3 className="font-semibold">Store</h3>
          <a
            href={marketplaceHref}
            className="inline-flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground"
          >
            <Store className="h-4 w-4" />
            Marketplace
          </a>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 px-4 py-5 text-center text-xs text-primary-foreground/70">
        © {year} {shop.name}
      </div>
    </footer>
  );
}

function UnavailableStorefront() {
  const marketplaceHref = marketplaceUrl();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-md border border-border bg-muted">
        <Store className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground">
          This shop is not available
        </h1>
        <p className="text-muted-foreground">
          The storefront may be inactive, suspended, or no longer exist.
        </p>
      </div>
      <Button asChild>
        <a href={marketplaceHref}>Go to marketplace</a>
      </Button>
    </main>
  );
}
