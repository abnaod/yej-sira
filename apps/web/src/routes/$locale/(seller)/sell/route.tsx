import type { Locale } from "@ys/intl";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { SellerAppShell } from "@/features/seller";
import { useLocale } from "@/lib/locale-path";

/** Index, onboarding, and legacy /register: full width, no seller sidebar. */
function isPublicSellPath(pathname: string, locale: Locale) {
  if (pathname === `/${locale}/sell` || pathname === `/${locale}/sell/`) return true;
  if (pathname === `/${locale}/sell/onboarding` || pathname.startsWith(`/${locale}/sell/onboarding/`)) {
    return true;
  }
  if (pathname === `/${locale}/sell/register` || pathname.startsWith(`/${locale}/sell/register/`)) {
    return true;
  }
  return false;
}

export const Route = createFileRoute("/$locale/(seller)/sell")({
  component: SellLayout,
});

function SellLayout() {
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isPublicSellPath(pathname, locale)) {
    return <Outlet />;
  }

  return <SellerAppShell />;
}
