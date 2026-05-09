import { Link, Outlet, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Heart, LogOut, Store, User } from "lucide-react";

import { BottomNav, MobileBottomNavScrollSpacer } from "@/components/layout/bottom-nav";
import { ContentContainer } from "@/components/layout/content-container";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer/footer";
import { Header } from "@/components/layout/header/header";
import { HeaderFilter } from "@/components/layout/header/header-filter";
import { HeaderNav } from "@/components/layout/header/header-nav";
import { HeaderSearch } from "@/components/layout/header/header-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthDialog } from "@/features/shared/auth";
import { assetUrl } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
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
        <div className="flex min-h-dvh flex-col bg-main-container">
          <UnavailableStorefront />
        </div>
      </StorefrontTenantProvider>
    );
  }

  if (tenant.context.isStorefront && tenant.shop) {
    return (
      <StorefrontTenantProvider value={tenant}>
        <div className="flex min-h-dvh flex-col bg-main-container">
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
      <div className="flex min-h-dvh flex-col bg-main-container">
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
  const navigate = useNavigate();
  const { openAuth } = useAuthDialog();
  const { data: session, isPending } = authClient.useSession();
  const fullName = session?.user?.name?.trim();
  const displayName =
    fullName?.split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    "Account";

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex shrink-0 items-center"
          aria-label={`${shop.name} home`}
        >
          <ShopLogo shop={shop} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <HeaderNav />
          <div className="flex min-w-0 flex-1 items-center gap-0">
            <HeaderFilter />
            <HeaderSearch />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isPending ? (
            <span className="flex h-9 items-center gap-1.5 px-2 text-sm text-muted-foreground">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Sign in</span>
            </span>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-1.5 px-2 text-sm font-normal text-foreground hover:text-primary"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden max-w-28 truncate sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem asChild>
                  <Link to="/$locale/favorites" params={{ locale }}>
                    <Heart />
                    Favorites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    void authClient.signOut(
                      {},
                      {
                        onSuccess: () => {
                          void navigate({ to: "/$locale", params: { locale } });
                        },
                      },
                    );
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-1.5 px-2 text-sm font-normal text-foreground hover:text-primary"
              onClick={() => openAuth()}
              aria-label="Sign in"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
          {!isPending && session?.user ? (
            <Button
              variant="ghost"
              className="hidden h-9 w-9 p-0 text-foreground hover:text-primary md:inline-flex"
              asChild
            >
              <Link
                to="/$locale/favorites"
                params={{ locale }}
                aria-label="Favorites"
              >
                <Heart className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          ) : null}
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
