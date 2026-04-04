import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, type Locale } from "@ys/intl";
import { useTranslation } from "react-i18next";

const LOCALE_LABEL_KEY: Record<Locale, "english" | "amharic"> = {
  en: "english",
  am: "amharic",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const locale = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const p = m.params as { locale?: string };
        if (p.locale && SUPPORTED_LOCALES.includes(p.locale as Locale)) {
          return p.locale as Locale;
        }
      }
      return "en" as Locale;
    },
  });

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    void navigate({
      to: ".",
      params: (prev) => ({ ...prev, locale: next }),
      search: true,
      hash: true,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto min-h-0 shrink-0 gap-1 px-1 py-0 font-normal text-foreground [&_svg]:size-3",
            className,
          )}
          aria-label={t("language")}
        >
          {t(LOCALE_LABEL_KEY[locale])}
          <ChevronDown className="shrink-0 opacity-80" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onSelect={() => switchTo(loc)}
            className={loc === locale ? "bg-accent" : undefined}
          >
            {t(LOCALE_LABEL_KEY[loc])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
