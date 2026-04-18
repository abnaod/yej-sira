import type { Locale } from "@ys/intl";

const routeLabels: Record<
  string,
  { title: string; subtitle?: string }
> = {
  "/admin/dashboard": {
    title: "Admin dashboard",
    subtitle: "Platform-wide metrics and recent activity",
  },
  "/admin/users": {
    title: "Users",
    subtitle: "Everyone with an account on the platform",
  },
  "/admin/shops": {
    title: "Shops",
    subtitle: "Approve, suspend, or review seller shops",
  },
  "/admin/listings": {
    title: "Listings",
    subtitle: "All listings across every shop",
  },
  "/admin/orders": {
    title: "Orders",
    subtitle: "Every customer order across the platform",
  },
  "/admin/categories": {
    title: "Categories",
    subtitle: "Browse taxonomy shown on the storefront",
  },
  "/admin/promotions": {
    title: "Promotions",
    subtitle: "Scheduled campaigns and featured badges",
  },
};

function stripLocale(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  if (!pathname.startsWith(prefix)) return pathname;
  return pathname.slice(prefix.length) || "/";
}

export function adminHeaderTitle(pathname: string, locale: Locale): string {
  const p = stripLocale(pathname, locale);
  for (const [key, value] of Object.entries(routeLabels)) {
    if (p === key || p.startsWith(`${key}/`)) return value.title;
  }
  return "";
}

export function adminHeaderSubtitle(pathname: string, locale: Locale): string {
  const p = stripLocale(pathname, locale);
  for (const [key, value] of Object.entries(routeLabels)) {
    if (p === key || p.startsWith(`${key}/`)) return value.subtitle ?? "";
  }
  return "";
}
