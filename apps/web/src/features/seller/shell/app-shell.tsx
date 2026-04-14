import { Outlet, useRouterState } from "@tanstack/react-router";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerAppSidebar } from "./seller-app-sidebar";
import { sellerPortalHeaderTitle } from "./seller-breadcrumb";

export function SellerAppShell() {
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = sellerPortalHeaderTitle(pathname, locale);

  return (
    <SidebarProvider>
      <SellerAppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        </header>
        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
