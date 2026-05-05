import { Link } from "@tanstack/react-router";
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
          className="min-w-0 flex-1 text-left font-medium underline-offset-2 hover:underline"
        >
          {t("announcementOpenShop")}
        </Link>

        <LanguageSwitcher className="shrink-0 text-xs text-primary-foreground hover:bg-gray-100 hover:text-primary" />
      </div>
    </div>
  );
}
