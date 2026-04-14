import type { Locale } from "@ys/intl";

/** Current section title for authenticated seller routes under `/$locale/sell/*`. */
export function sellerPortalHeaderTitle(
  pathname: string,
  locale: Locale,
): string {
  const sellPrefix = `/${locale}/sell`;
  const afterSell = pathname.startsWith(sellPrefix)
    ? pathname.slice(sellPrefix.length).replace(/^\//, "")
    : "";
  const segments = afterSell.split("/").filter(Boolean);

  if (segments[0] === "dashboard" || segments.length === 0) {
    return "Dashboard";
  }

  if (segments[0] === "orders") {
    return "Orders";
  }

  if (segments[0] === "products") {
    if (segments[1] === "new") return "New product";
    if (segments[1]) return "Edit product";
    return "Products";
  }

  return segments.at(-1) ?? "Page";
}
