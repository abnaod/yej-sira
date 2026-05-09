import * as React from "react";
import { Link } from "@tanstack/react-router";
import type { Locale } from "@ys/intl";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ys-cookie-consent-v1";

export function CookieBanner() {
  const locale = useLocale() as Locale;
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      /* ignore — e.g. Safari private mode */
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className={cn(
        "fixed inset-x-2 z-50 mx-auto max-w-3xl rounded-lg border bg-background p-4 shadow-lg",
        /* Sit above the mobile bottom nav (h-16 + safe area), not on top of it */
        "bottom-[calc(0.5rem+4rem+env(safe-area-inset-bottom))]",
        "md:inset-x-4 md:bottom-4",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies to keep you signed in and to remember your cart. See our{" "}
          <Link
            to="/$locale/legal/privacy"
            params={{ locale }}
            className="font-medium underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <Button size="sm" onClick={dismiss} className="shrink-0">
          Got it
        </Button>
      </div>
    </div>
  );
}
