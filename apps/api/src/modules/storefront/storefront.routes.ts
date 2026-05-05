import { Hono } from "hono";

export const storefrontRouter = new Hono();

storefrontRouter.get("/storefront/tenant", (c) => {
  const shop = c.get("storefrontShop");
  return c.json({ shop });
});
