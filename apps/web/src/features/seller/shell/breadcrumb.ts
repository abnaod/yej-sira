import type { Locale } from "@ys/intl";

function sellSegments(pathname: string, locale: Locale): string[] {
  const sellPrefix = `/${locale}/sell`;
  const afterSell = pathname.startsWith(sellPrefix)
    ? pathname.slice(sellPrefix.length).replace(/^\//, "")
    : "";
  return afterSell.split("/").filter(Boolean);
}

/** Current section title for authenticated seller routes under `/$locale/sell/*`. */
export function sellerPortalHeaderTitle(
  pathname: string,
  locale: Locale,
): string {
  const segments = sellSegments(pathname, locale);

  if (segments[0] === "dashboard" || segments.length === 0) {
    return "Dashboard";
  }

  if (segments[0] === "orders") {
    if (segments.length > 1) {
      return "";
    }
    return "Orders";
  }

  if (segments[0] === "listings") {
    if (segments[1] === "new") return "New listing";
    if (segments[1]) return "Edit listing";
    return "Listings";
  }

  if (segments[0] === "messages") {
    return "";
  }

  if (segments[0] === "storefront") {
    return "";
  }

  return segments.at(-1) ?? "Page";
}

/** Short description shown under the portal header title. */
export function sellerPortalHeaderSubtitle(
  pathname: string,
  locale: Locale,
): string {
  const segments = sellSegments(pathname, locale);

  if (segments[0] === "dashboard" || segments.length === 0) {
    return "Overview of your shop and recent activity.";
  }

  if (segments[0] === "orders") {
    if (segments.length > 1) {
      return "";
    }
    return "View and manage customer orders.";
  }

  if (segments[0] === "listings") {
    if (segments[1] === "new") {
      return "Create a listing with variants, images, and details.";
    }
    if (segments[1]) {
      return "Update listing details, pricing, and inventory.";
    }
    return "Manage your catalog and inventory.";
  }

  if (segments[0] === "messages") {
    return "";
  }

  if (segments[0] === "storefront") {
    return "";
  }

  return "Seller portal";
}
