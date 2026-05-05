import { Link, useParams } from "@tanstack/react-router";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@ys/intl";

import { useAuthDialog } from "@/features/shared/auth";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SellerMarketingHeader() {
  const localeParam = useParams({
    from: "/$locale",
    select: (p) => p.locale,
  });
  const locale: Locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  const { openAuth } = useAuthDialog();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          to="/$locale"
          params={{ locale }}
          reloadDocument
          activeOptions={{ exact: true }}
          className="flex shrink-0 items-center"
        >
          <BrandLogo className="text-primary" />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {!sessionPending && !session?.user && (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="rounded-full"
              onClick={() => openAuth({ redirectToSellerPortal: true })}
            >
              Sign in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
