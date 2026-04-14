import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Store } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerNavUser } from "./seller-nav-user";

function matchesSellPath(pathname: string, locale: Locale, suffix: string) {
  const prefix = `/${locale}/sell`;
  return pathname === `${prefix}${suffix}` || pathname.startsWith(`${prefix}${suffix}/`);
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
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Seller</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Shop</SidebarGroupLabel>
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
                  isActive={matchesSellPath(pathname, locale, "/products")}
                >
                  <Link to="/$locale/sell/products" params={{ locale }}>
                    <Package />
                    <span>Products</span>
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
