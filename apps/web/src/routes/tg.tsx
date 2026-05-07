import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { isValidShopSlug } from "@/lib/storefront";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        initDataUnsafe?: {
          start_param?: string;
        };
      };
    };
  }
}

const DEFAULT_LOCALE = "en";

export const Route = createFileRoute("/tg")({
  component: TelegramMiniAppLauncher,
});

function readTelegramStartParam(): string | null {
  if (typeof window === "undefined") return null;

  const search = new URLSearchParams(window.location.search);
  const fromQuery =
    search.get("tgWebAppStartParam") ?? search.get("startapp") ?? search.get("shop");
  if (fromQuery) return fromQuery.trim().toLowerCase();

  return window.Telegram?.WebApp?.initDataUnsafe?.start_param?.trim().toLowerCase() ?? null;
}

function localeFromTelegram(): string {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const searchLocale = new URLSearchParams(window.location.search).get("locale");
  if (searchLocale === "am" || searchLocale === "en") return searchLocale;
  return DEFAULT_LOCALE;
}

function storefrontPath(locale: string, shopSlug: string) {
  const search = new URLSearchParams({ shop: shopSlug, tg: "1" });
  return `/${locale}?${search.toString()}`;
}

function TelegramMiniAppLauncher() {
  const [invalidParam, setInvalidParam] = useState<string | null>(null);
  const marketplaceHref = useMemo(() => `/${DEFAULT_LOCALE}`, []);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();

    const startParam = readTelegramStartParam();
    if (!startParam) {
      window.location.replace(marketplaceHref);
      return;
    }

    if (!isValidShopSlug(startParam)) {
      setInvalidParam(startParam);
      return;
    }

    window.location.replace(storefrontPath(localeFromTelegram(), startParam));
  }, [marketplaceHref]);

  if (invalidParam) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-md border border-border bg-muted">
          <Store className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground">
            This shop link is not available
          </h1>
          <p className="text-muted-foreground">
            The Telegram link may be incomplete, expired, or pointing to a shop that cannot be opened.
          </p>
        </div>
        <Button asChild>
          <a href={marketplaceHref}>Go to marketplace</a>
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 text-sm text-muted-foreground">
      Opening shop…
    </main>
  );
}
