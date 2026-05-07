import { Link } from "@tanstack/react-router";
import { ChevronRight, Store } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLocale } from "@/lib/locale-path";

import { LanguageSwitcher } from "./language-switcher";

export function AnnouncementBar() {
  const { t } = useTranslation("common");
  const locale = useLocale();

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs">
        <Link
          to="/$locale/sell"
          params={{ locale }}
          className="group flex min-h-5 min-w-0 max-w-full items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary px-2.5 py-0.5 text-left font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors hover:border-primary-foreground/35 hover:bg-primary-hover"
        >
          <Store
            className="size-3 shrink-0 text-primary-foreground"
            aria-hidden
          />
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="shrink-0 font-semibold">{t("openShop")}</span>
            <span
              className="hidden size-1 rounded-full bg-primary-foreground/65 sm:block"
              aria-hidden
            />
            <span className="truncate text-primary-foreground/85">
              {t("announcementOpenShop")}
            </span>
          </span>
          <ChevronRight
            className="size-3 shrink-0 text-primary-foreground/55 transition-colors group-hover:text-primary-foreground"
            aria-hidden
          />
        </Link>

        <LanguageSwitcher className="shrink-0 text-xs text-primary-foreground hover:bg-gray-100 hover:text-primary" />
      </div>
    </div>
  );
}
