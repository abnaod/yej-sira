import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Heart,
  LogOut,
  Package,
  Shield,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuthDialog } from "@/features/shared/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cartQuery } from "@/features/store/cart/cart.queries";
import { currentUserQuery } from "@/features/shared/current-user.queries";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { BrandLogo } from "../brand-logo";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderFilter } from "./header-filter";
import { HeaderSearch } from "./header-search";
import { HeaderNav } from "./header-nav";

export function Header() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const navigate = useNavigate();
  const { openAuth } = useAuthDialog();
  const { data: session, isPending } = authClient.useSession();
  const meQuery = useQuery({
    ...currentUserQuery(),
    enabled: !!session?.user,
  });
  const isAdmin = meQuery.data?.user.role === "admin";

  const { data: cart } = useQuery(cartQuery(locale));
  const cartItemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    t("account");

  return (
    <header className="border-b border-border bg-white">
      <AnnouncementBar />
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex shrink-0 items-center"
        >
          <BrandLogo className="text-primary" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <HeaderNav />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <HeaderFilter />
            <HeaderSearch />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isPending ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">…</span>
            </span>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto gap-1.5 px-1.5 py-1 text-sm font-normal text-foreground hover:text-primary"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden max-w-40 truncate sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem asChild>
                  <Link to="/$locale/orders" params={{ locale }}>
                    <Package />
                    {t("orders")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/$locale/sell" params={{ locale }}>
                    <Store />
                    {t("myShop")}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/$locale/admin/dashboard" params={{ locale }}>
                      <Shield />
                      {t("adminPortal", { defaultValue: "Admin portal" })}
                    </Link>
                  </DropdownMenuItem>
                )}
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
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-auto gap-1.5 px-1.5 py-1 text-sm font-normal text-foreground hover:text-primary"
              onClick={() => openAuth()}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t("account")}</span>
            </Button>
          )}
          {!isPending && session?.user && (
            <Link
              to="/$locale/favorites"
              params={{ locale }}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-foreground transition-colors hover:text-primary"
              aria-label={t("favorites")}
            >
              <Heart className="h-4 w-4" aria-hidden />
            </Link>
          )}
          <Link
            to="/$locale/cart"
            params={{ locale }}
            className="relative inline-flex items-center justify-center rounded-md p-1.5 text-foreground transition-colors hover:text-primary"
            aria-label={
              cartItemCount > 0
                ? `${t("cart")} (${cartItemCount})`
                : t("cart")
            }
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
            {cartItemCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums"
                aria-hidden
              >
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
