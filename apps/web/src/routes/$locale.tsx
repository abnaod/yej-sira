import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLocale } from "@ys/intl";
import { useEffect } from "react";

import i18n from "@/lib/i18n";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw redirect({ to: "/$locale", params: { locale: "en" } });
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();

  useEffect(() => {
    void i18n.changeLanguage(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return <Outlet />;
}
