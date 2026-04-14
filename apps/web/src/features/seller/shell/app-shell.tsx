import { Outlet, useRouterState } from "@tanstack/react-router";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerAppSidebar } from "./app-sidebar";
import {
  sellerPortalHeaderSubtitle,
  sellerPortalHeaderTitle,
} from "./breadcrumb";

export function SellerAppShell() {
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = sellerPortalHeaderTitle(pathname, locale);
  const subtitle = sellerPortalHeaderSubtitle(pathname, locale);
  const showHeader = title.length > 0 || subtitle.length > 0;

  return (
    <SidebarProvider>
      <SellerAppSidebar />
      <SidebarInset>
        <div
          className={
            showHeader
              ? "flex min-h-0 flex-1 flex-col gap-4 px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6"
              : "flex min-h-0 flex-1 flex-col px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6"
          }
        >
          {showHeader ? (
            <div className="shrink-0 space-y-0.5">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-xss text-muted-foreground">{subtitle}</p>
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
