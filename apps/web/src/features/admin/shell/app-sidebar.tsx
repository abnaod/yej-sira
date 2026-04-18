import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Users,
} from "lucide-react";

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

import { AdminNavUser } from "./nav-user";

function matchesAdminPath(pathname: string, locale: Locale, suffix: string) {
  const prefix = `/${locale}/admin`;
  return pathname === `${prefix}${suffix}` || pathname.startsWith(`${prefix}${suffix}/`);
}

/** Left nav for the admin portal. Mirrors the seller sidebar structure. */
export function AdminAppSidebar() {
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/$locale/admin/dashboard" params={{ locale }}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-xss leading-tight">
                  <span className="truncate font-medium">Admin</span>
                  <span className="truncate text-xxs text-sidebar-foreground/70">
                    Platform control
                  </span>
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
                  isActive={matchesAdminPath(pathname, locale, "/dashboard")}
                >
                  <Link to="/$locale/admin/dashboard" params={{ locale }}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesAdminPath(pathname, locale, "/users")}
                >
                  <Link to="/$locale/admin/users" params={{ locale }}>
                    <Users />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesAdminPath(pathname, locale, "/shops")}
                >
                  <Link to="/$locale/admin/shops" params={{ locale }}>
                    <Store />
                    <span>Shops</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesAdminPath(pathname, locale, "/listings")}
                >
                  <Link to="/$locale/admin/listings" params={{ locale }}>
                    <Package />
                    <span>Listings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesAdminPath(pathname, locale, "/orders")}
                >
                  <Link to="/$locale/admin/orders" params={{ locale }}>
                    <ShoppingBag />
                    <span>Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesAdminPath(pathname, locale, "/categories")}
                >
                  <Link to="/$locale/admin/categories" params={{ locale }}>
                    <Tag />
                    <span>Categories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={matchesAdminPath(pathname, locale, "/promotions")}
                >
                  <Link to="/$locale/admin/promotions" params={{ locale }}>
                    <Sparkles />
                    <span>Promotions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
