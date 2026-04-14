import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuthDialog } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";

export function SellerLandingPage() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const { openAuth } = useAuthDialog();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Store className="size-7 text-primary" aria-hidden />
          </div>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground md:text-5xl">
            Sell on Yej Sira
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Open your shop, reach customers across Ethiopia and the diaspora, and manage listings from one
            place. Complete a short application to get started.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            {!sessionPending &&
              (session?.user ? (
                <Button size="lg" asChild>
                  <Link to="/$locale/sell/register" params={{ locale }}>
                    {t("sellerGetStarted")}
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  type="button"
                  onClick={() => openAuth({ redirectToSellerPortal: true })}
                >
                  {t("sellerGetStarted")}
                </Button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
