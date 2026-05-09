import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  Home,
  LogOut,
  MessageSquare,
  Package,
  Shield,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAuthDialog } from "@/features/shared/auth";
import { currentUserQuery } from "@/features/shared/current-user.queries";
import { authClient } from "@/lib/auth-client";
import { featureCartCheckout, featureConversations } from "@/lib/features";
import { useLocale } from "@/lib/locale-path";
import { marketplaceUrl } from "@/lib/storefront";
import { cn } from "@/lib/utils";

export type BottomNavVariant = "marketplace" | "shop";

/** In-flow block: same height as `BottomNav` (`h-14` + safe area). Ensures scrollable pages clear the fixed bar. */
export function MobileBottomNavScrollSpacer() {
  return (
    <div
      aria-hidden
      className="shrink-0 md:hidden min-h-[calc(3.5rem+env(safe-area-inset-bottom))]"
    />
  );
}

/** Mobile bottom navigation for the storefront. Hidden at `md` and above. */
export function BottomNav({ variant = "marketplace" }: { variant?: BottomNavVariant }) {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { openAuth } = useAuthDialog();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const showCart = variant === "marketplace" && featureCartCheckout;
  const meQuery = useQuery({
    ...currentUserQuery(),
    enabled: !!session?.user,
  });
  const isAdmin = meQuery.data?.user.role === "admin";

  const [accountOpen, setAccountOpen] = React.useState(false);

  const isHomeActive = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isFavoritesActive = pathname.startsWith(`/${locale}/favorites`);
  const isMessagesActive = pathname.startsWith(`/${locale}/messages`);
  const isCartActive = pathname.startsWith(`/${locale}/cart`);
  const isAccountActive =
    pathname.startsWith(`/${locale}/orders`) ||
    pathname.startsWith(`/${locale}/sell`) ||
    pathname.startsWith(`/${locale}/admin`) ||
    accountOpen;

  const handleAccountClick = () => {
    if (isSessionPending) return;
    if (session?.user) {
      setAccountOpen(true);
    } else {
      openAuth();
    }
  };

  const handleSignOut = () => {
    void authClient.signOut(
      {},
      {
        onSuccess: () => {
          setAccountOpen(false);
          void navigate({ to: "/$locale", params: { locale } });
        },
      },
    );
  };

  return (
    <>
      <nav
        aria-label={t("primaryNavigation")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white shadow-[0_-1px_0_rgba(0,0,0,0.04)]",
          "pb-[env(safe-area-inset-bottom)] md:hidden",
        )}
      >
        <ul
          className={cn(
            "grid h-14",
            showCart && featureConversations
              ? "grid-cols-5"
              : showCart || featureConversations
                ? "grid-cols-4"
                : "grid-cols-3",
          )}
        >
          <NavSlot>
            <Link
              to="/$locale"
              params={{ locale }}
              className={navItemClass(isHomeActive)}
              aria-current={isHomeActive ? "page" : undefined}
            >
              <Home className="size-4" aria-hidden />
              <span className="text-[11px] leading-none">{t("home")}</span>
            </Link>
          </NavSlot>

          <NavSlot>
            <Link
              to="/$locale/favorites"
              params={{ locale }}
              className={navItemClass(isFavoritesActive)}
              aria-current={isFavoritesActive ? "page" : undefined}
            >
              <Heart className="size-4" aria-hidden />
              <span className="text-[11px] leading-none">{t("favorites")}</span>
            </Link>
          </NavSlot>

          {featureConversations ? (
            <NavSlot>
              <Link
                to="/$locale/messages"
                params={{ locale }}
                className={navItemClass(isMessagesActive)}
                aria-current={isMessagesActive ? "page" : undefined}
              >
                <MessageSquare className="size-4" aria-hidden />
                <span className="text-[11px] leading-none">{t("messages")}</span>
              </Link>
            </NavSlot>
          ) : null}

          {showCart ? (
            <NavSlot>
              <Link
                to="/$locale/cart"
                params={{ locale }}
                className={navItemClass(isCartActive)}
                aria-current={isCartActive ? "page" : undefined}
              >
                <ShoppingCart className="size-4" aria-hidden />
                <span className="text-[11px] leading-none">{t("cart")}</span>
              </Link>
            </NavSlot>
          ) : null}

          <NavSlot>
            <button
              type="button"
              onClick={handleAccountClick}
              aria-haspopup={session?.user ? "dialog" : undefined}
              aria-expanded={session?.user ? accountOpen : undefined}
              className={navItemClass(isAccountActive)}
            >
              <User className="size-4" aria-hidden />
              <span className="text-[11px] leading-none">
                {session?.user ? t("account") : t("signIn")}
              </span>
            </button>
          </NavSlot>
        </ul>
      </nav>

      <Drawer open={accountOpen} onOpenChange={setAccountOpen}>
        <DrawerContent className="max-h-[80dvh] gap-0">
          <DrawerHeader className="border-b border-border text-left">
            <DrawerTitle className="truncate">
              {session?.user?.name?.trim() ||
                session?.user?.email ||
                t("account")}
            </DrawerTitle>
          </DrawerHeader>
          <ul className="flex flex-col py-1 pb-[env(safe-area-inset-bottom)]">
            {variant === "marketplace" && (
              <li>
                <DrawerClose asChild>
                  <Link
                    to="/$locale/orders"
                    params={{ locale }}
                    className={accountItemClass}
                  >
                    <Package className="size-4" aria-hidden />
                    {t("orders")}
                  </Link>
                </DrawerClose>
              </li>
            )}
            {variant === "marketplace" && (
              <li>
                <DrawerClose asChild>
                  <Link
                    to="/$locale/sell"
                    params={{ locale }}
                    className={accountItemClass}
                  >
                    <Store className="size-4" aria-hidden />
                    {t("myShop")}
                  </Link>
                </DrawerClose>
              </li>
            )}
            {variant === "marketplace" && isAdmin && (
              <li>
                <DrawerClose asChild>
                  <Link
                    to="/$locale/admin/dashboard"
                    params={{ locale }}
                    className={accountItemClass}
                  >
                    <Shield className="size-4" aria-hidden />
                    {t("adminPortal", { defaultValue: "Admin portal" })}
                  </Link>
                </DrawerClose>
              </li>
            )}
            {variant === "shop" && (
              <li>
                <DrawerClose asChild>
                  <a
                    href={marketplaceUrl(`/${locale}`)}
                    className={accountItemClass}
                  >
                    <Store className="size-4" aria-hidden />
                    {t("brand")}
                  </a>
                </DrawerClose>
              </li>
            )}
            <li className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(accountItemClass, "w-full text-left")}
              >
                <LogOut className="size-4" aria-hidden />
                {t("signOut")}
              </button>
            </li>
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function NavSlot({ children }: { children: React.ReactNode }) {
  return <li className="contents">{children}</li>;
}

function navItemClass(isActive: boolean) {
  return cn(
    "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );
}

const accountItemClass =
  "flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/50";
