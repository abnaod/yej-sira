import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { DEFAULT_LOCALE, isLocale } from "@ys/intl";

export function NotFoundPage() {
  const { t, i18n } = useTranslation("common");
  const loc = i18n.resolvedLanguage ?? i18n.language;
  const locale = isLocale(loc) ? loc : DEFAULT_LOCALE;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-serif text-2xl font-normal text-foreground">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("notFoundDescription")}
      </p>
      <Link
        to="/$locale"
        params={{ locale }}
        className="mt-6 text-sm font-medium text-foreground underline underline-offset-4"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
