import type { Locale } from "@ys/intl";

export function pickCategoryName(
  row: { name: string; translations: { name: string }[] },
  locale: Locale,
): string {
  if (locale === "en") return row.name;
  return row.translations[0]?.name ?? row.name;
}

export function pickListingName(
  row: { name: string; translations: { name: string }[] },
  locale: Locale,
): string {
  if (locale === "en") return row.name;
  return row.translations[0]?.name ?? row.name;
}

export function pickListingDescription(
  row: { description: string; translations: { description: string }[] },
  locale: Locale,
): string {
  if (locale === "en") return row.description;
  return row.translations[0]?.description ?? row.description;
}

export function pickTagName(
  row: { name: string; translations: { name: string }[] },
  locale: Locale,
): string {
  if (locale === "en") return row.name;
  return row.translations[0]?.name ?? row.name;
}

export function pickVariantLabel(
  row: { label: string; translations: { label: string }[] },
  locale: Locale,
): string {
  if (locale === "en") return row.label;
  return row.translations[0]?.label ?? row.label;
}

export function pickPromotionCopy(
  row: {
    title: string;
    subtitle: string | null;
    badgeLabel: string;
    translations: { title: string; subtitle: string | null; badgeLabel: string }[];
  },
  locale: Locale,
): { title: string; subtitle?: string; badgeLabel: string } {
  if (locale === "en") {
    return {
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      badgeLabel: row.badgeLabel,
    };
  }
  const t = row.translations[0];
  if (!t) {
    return {
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      badgeLabel: row.badgeLabel,
    };
  }
  return {
    title: t.title,
    subtitle: t.subtitle ?? undefined,
    badgeLabel: t.badgeLabel,
  };
}
