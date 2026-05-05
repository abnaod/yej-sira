/** "Just now" / "3 min" / "2 h" / short date for inbox list rows. */
export function inboxTimeLabel(
  iso: string,
  locale: string,
  t: (key: string, options?: { count: number }) => string,
): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return t("justNow");
  if (d < 60 * 60_000) return t("minutesAgo", { count: Math.max(1, Math.floor(d / 60_000)) });
  if (d < 24 * 60 * 60_000) return t("hoursAgo", { count: Math.max(1, Math.floor(d / (60 * 60_000))) });
  return new Date(iso).toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function dayDividerLabel(
  iso: string,
  locale: string,
  t: (key: string) => string,
  now: Date = new Date(),
): string {
  const x = new Date(iso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  if (y.getTime() === today.getTime()) return t("today");
  const yday = new Date(today);
  yday.setDate(yday.getDate() - 1);
  if (y.getTime() === yday.getTime()) return t("yesterday");
  return x.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" });
}

export function timeShort(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}
