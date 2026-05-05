import { Hono } from "hono";

import { prisma, publicListingVisibilityWhere } from "../../lib/db";
import { getEnv } from "../../lib/env";

export const seoRouter = new Hono();

seoRouter.get("/robots.txt", (c) => {
  const env = getEnv();
  const webUrl = env.PUBLIC_WEB_URL.replace(/\/$/, "");
  c.header("Content-Type", "text/plain; charset=utf-8");
  return c.body(
    [
      "User-agent: *",
      env.NODE_ENV === "production" ? "Allow: /" : "Disallow: /",
      `Sitemap: ${webUrl}/sitemap.xml`,
      "",
    ].join("\n"),
  );
});

/** Minimal sitemap: categories, active shops, and published listings, in both locales. */
seoRouter.get("/sitemap.xml", async (c) => {
  const env = getEnv();
  const base = env.PUBLIC_WEB_URL.replace(/\/$/, "");
  const locales = ["en", "am"] as const;

  const [categories, shops, listings] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.shop.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.listing.findMany({
      where: publicListingVisibilityWhere,
      select: { id: true, updatedAt: true },
      take: 5000,
    }),
  ]);

  const urls: { loc: string; lastmod?: string }[] = [];
  for (const locale of locales) {
    urls.push({ loc: `${base}/${locale}` });
    urls.push({ loc: `${base}/${locale}/legal/terms` });
    urls.push({ loc: `${base}/${locale}/legal/privacy` });
    urls.push({ loc: `${base}/${locale}/legal/returns` });
    urls.push({ loc: `${base}/${locale}/legal/seller-policy` });
    for (const cat of categories) {
      urls.push({
        loc: `${base}/${locale}/categories/${cat.slug}`,
        lastmod: cat.updatedAt.toISOString(),
      });
    }
    for (const shop of shops) {
      urls.push({
        loc: `${base}/${locale}/shops/${shop.slug}`,
        lastmod: shop.updatedAt.toISOString(),
      });
    }
    for (const listing of listings) {
      urls.push({
        loc: `${base}/${locale}/listings/${listing.id}`,
        lastmod: listing.updatedAt.toISOString(),
      });
    }
  }

  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map(
      (u) =>
        `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
    ),
    `</urlset>`,
  ].join("\n");

  c.header("Content-Type", "application/xml; charset=utf-8");
  return c.body(body);
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
