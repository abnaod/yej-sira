import type { Locale } from "@ys/intl";
import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";

import {
  myShopQuery,
  SellerAppShell,
  type MyShopResponse,
} from "@/features/seller";
import { useLocale } from "@/lib/locale-path";

/** Landing + register: full-width. Same paths used in `beforeLoad` for dashboard redirect. */
function isSellMarketingPath(pathname: string, locale: Locale) {
  return (
    pathname === `/${locale}/sell` ||
    pathname === `/${locale}/sell/` ||
    pathname === `/${locale}/sell/register` ||
    pathname.startsWith(`/${locale}/sell/register/`)
  );
}

export const Route = createFileRoute("/$locale/(seller)/sell")({
  beforeLoad: async ({ context, params, location }) => {
    const locale = params.locale as Locale;
    if (!isSellMarketingPath(location.pathname, locale)) {
      return;
    }
    let data: MyShopResponse | { shop: null };
    try {
      data = await context.queryClient.fetchQuery({
        ...myShopQuery(locale),
        staleTime: 0,
      });
    } catch {
      return;
    }
    if (data.shop) {
      throw redirect({
        to: "/$locale/sell/dashboard",
        params: { locale: params.locale },
      });
    }
  },
  component: SellLayout,
});

function SellLayout() {
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isSellMarketingPath(pathname, locale)) {
    return <Outlet />;
  }

  return <SellerAppShell />;
}
