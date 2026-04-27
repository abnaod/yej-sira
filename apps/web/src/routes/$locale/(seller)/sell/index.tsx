import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@ys/intl";

import { SellerMarketingHeader } from "@/features/seller/onboarding/seller-marketing-header";
import { myShopQuery } from "@/features/seller";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";

function SellIndexRedirect() {
  const locale = useLocale() as Locale;
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const shopQuery = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });

  const loading = sessionPending || (!!session?.user && shopQuery.isLoading);

  return (
    <div className="bg-background">
      <SellerMarketingHeader />
      {loading ? null : session?.user && shopQuery.data?.shop ? (
        <Navigate to="/$locale/sell/dashboard" params={{ locale }} />
      ) : (
        <Navigate to="/$locale/sell/onboarding" params={{ locale }} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/$locale/(seller)/sell/")({
  component: SellIndexRedirect,
});
