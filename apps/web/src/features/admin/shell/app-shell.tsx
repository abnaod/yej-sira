import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { AdminAppSidebar } from "./app-sidebar";
import { adminHeaderSubtitle, adminHeaderTitle } from "./breadcrumb";
import { currentUserQuery } from "@/features/shared/current-user.queries";

/**
 * Client-side admin guard. `beforeLoad` can't run the session fetch during SSR
 * (cookies aren't forwarded), so we gate rendering here and redirect to `/`
 * for anonymous users or non-admins.
 */
export function AdminAppShell() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const meQuery = useQuery({
    ...currentUserQuery(),
    enabled: !!session?.user,
  });

  const role = meQuery.data?.user.role;
  const isUnauthorized =
    !sessionPending &&
    (!session?.user || (!meQuery.isLoading && role !== undefined && role !== "admin"));

  useEffect(() => {
    if (isUnauthorized) {
      void navigate({ to: "/$locale", params: { locale } });
    }
  }, [isUnauthorized, navigate, locale]);

  if (sessionPending || !session?.user || meQuery.isLoading || role !== "admin") {
    return null;
  }

  const title = adminHeaderTitle(pathname, locale);
  const subtitle = adminHeaderSubtitle(pathname, locale);
  const showHeader = title.length > 0 || subtitle.length > 0;

  return (
    <SidebarProvider>
      <AdminAppSidebar />
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
