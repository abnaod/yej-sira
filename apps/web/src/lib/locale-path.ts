import { useParams } from "@tanstack/react-router";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@ys/intl";

/** Active locale from the URL (`/$locale/...`). */
export function useLocale(): Locale {
  const p = useParams({ strict: false }) as { locale?: string };
  return p.locale && isLocale(p.locale) ? p.locale : DEFAULT_LOCALE;
}

/** Prefix a path with `/${locale}` for client-side navigation. */
export function withLocale(path: string, locale: Locale): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith(`/${locale}/`) || normalized === `/${locale}`) {
    return normalized;
  }
  return `/${locale}${normalized === "/" ? "/" : normalized}`;
}
