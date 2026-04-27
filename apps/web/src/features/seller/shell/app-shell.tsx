import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerAppSidebar } from "./app-sidebar";
import {
  sellerPortalHeaderSubtitle,
  sellerPortalHeaderTitle,
} from "./breadcrumb";
import { myShopQuery } from "../shared/shop.queries";

export function SellerAppShell() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const shopQuery = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });

  // Redirect to landing page when the client-side fetch confirms no shop.
  useEffect(() => {
    if (sessionPending) return;
    if (!session?.user) {
      void navigate({ to: "/$locale/sell/onboarding", params: { locale } });
      return;
    }
    if (!shopQuery.isLoading && !shopQuery.data?.shop) {
      void navigate({ to: "/$locale/sell/onboarding", params: { locale } });
    }
  }, [sessionPending, session?.user, shopQuery.isLoading, shopQuery.data, navigate, locale]);

  // Show nothing while session / shop data is loading to avoid layout flash.
  if (sessionPending || !session?.user || shopQuery.isLoading || !shopQuery.data?.shop) {
    return null;
  }

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
