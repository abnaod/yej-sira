export const SUPPORTED_LOCALES = ["en", "am"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Parse a raw header or param value into a supported locale, or null. */
export function parseLocale(value: string | undefined | null): Locale | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "am" || trimmed.startsWith("am-")) return "am";
  if (trimmed === "en" || trimmed.startsWith("en-")) return "en";
  return null;
}

/**
 * Parse Accept-Language (first tag wins). Returns null if no supported locale found.
 */
export function parseAcceptLanguage(header: string | undefined | null): Locale | null {
  if (!header?.trim()) return null;
  const parts = header.split(",");
  for (const part of parts) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const primary = tag.split("-")[0] ?? tag;
    const loc = parseLocale(primary);
    if (loc) return loc;
  }
  return null;
}

/**
 * Resolve locale: explicit X-Locale wins, then Accept-Language, then default.
 */
export function resolveRequestLocale(
  xLocale: string | undefined | null,
  acceptLanguage: string | undefined | null,
): Locale {
  const fromHeader = parseLocale(xLocale);
  if (fromHeader) return fromHeader;
  const fromAccept = parseAcceptLanguage(acceptLanguage);
  if (fromAccept) return fromAccept;
  return DEFAULT_LOCALE;
}
