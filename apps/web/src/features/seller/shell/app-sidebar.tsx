import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Store } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerNavUser } from "./nav-user";

function matchesSellPath(pathname: string, locale: Locale, suffix: string) {
  const prefix = `/${locale}/sell`;
  return pathname === `${prefix}${suffix}` || pathname.startsWith(`${prefix}${suffix}/`);
}

/** `/sell/orders/:orderId` — not the orders list. */
function isSellerOrderDetailPath(pathname: string, locale: Locale) {
  const base = `/${locale}/sell/orders`;
  if (!pathname.startsWith(base)) return false;
  const after = pathname.slice(base.length).replace(/^\//, "").replace(/\/$/, "");
  return after.length > 0;
}

/** Left nav for the seller portal (shadcn sidebar-01–style `AppSidebar`). */
export function SellerAppSidebar() {
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/$locale/sell/dashboard" params={{ locale }}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Store className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-xss leading-tight">
                  {isSellerOrderDetailPath(pathname, locale) ? (
                    <>
                      <span className="truncate font-medium">Portal</span>
                      <span className="truncate text-xxs text-sidebar-foreground/70">
                        Order details
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="truncate font-medium">Seller</span>
                      <span className="truncate text-xxs text-sidebar-foreground/70">Portal</span>
                    </>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesSellPath(pathname, locale, "/dashboard")}
                >
                  <Link to="/$locale/sell/dashboard" params={{ locale }}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesSellPath(pathname, locale, "/orders")}
                >
                  <Link to="/$locale/sell/orders" params={{ locale }}>
                    <ShoppingBag />
                    <span>Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesSellPath(pathname, locale, "/listings")}
                >
                  <Link to="/$locale/sell/listings" params={{ locale }} search={{ new: false, edit: undefined }}>
                    <Package />
                    <span>Listings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SellerNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
