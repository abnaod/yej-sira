import { Link } from "@tanstack/react-router";
import type { Locale } from "@ys/intl";

import { useAuthDialog } from "@/features/shared/auth";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";

/**
 * Header for public seller marketing routes (`/sell`, `/sell/onboarding`).
 * `activeOptions.exact` is required: the default prefix match treats `/en/sell/...` as
 * “active” for `to="/$locale"` (storefront home), which breaks navigation semantics and
 * can confuse focus/active styling.
 */
export function SellerMarketingHeader() {
  const locale = useLocale() as Locale;
  const { openAuth } = useAuthDialog();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          to="/$locale"
          params={{ locale }}
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
