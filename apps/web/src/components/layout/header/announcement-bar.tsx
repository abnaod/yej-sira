import { ChevronDown, Phone } from "lucide-react";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useLocale } from "@/lib/locale-path";

import { LanguageSwitcher } from "./language-switcher";

export function AnnouncementBar() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          <span>+251911223344</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center">
          <span>{t("announcement")}</span>
          <span className="mx-1">|</span>
          <Link
            to="/$locale"
            params={{ locale }}
            className="font-medium underline underline-offset-2"
          >
            {t("shopHandmade")}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="text-xs text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
          <button
            type="button"
            className="flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            Location
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
