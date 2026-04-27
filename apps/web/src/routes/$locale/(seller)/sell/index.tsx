import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@ys/intl";

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

  if (sessionPending || (session?.user && shopQuery.isLoading)) {
    return null;
  }

  if (session?.user && shopQuery.data?.shop) {
    return <Navigate to="/$locale/sell/dashboard" params={{ locale }} />;
  }

  return <Navigate to="/$locale/sell/onboarding" params={{ locale }} />;
}

export const Route = createFileRoute("/$locale/(seller)/sell/")({
  component: SellIndexRedirect,
});
