import { apiFetch } from "@/lib/api";
import {
  type PublicStorefrontShop,
  type StorefrontHostContext,
  getBrowserStorefrontContext,
  resolveStorefrontHost,
} from "@/lib/storefront";

export type StorefrontTenant = {
  context: StorefrontHostContext;
  shop: PublicStorefrontShop | null;
};

export async function getCurrentStorefrontHostContext(): Promise<StorefrontHostContext> {
  if (import.meta.env.SSR) {
    const { getServerRequestHost, getServerRequestShopParam } = await import(
      "@/lib/api/ssr-cookies"
    );
    const [serverHost, queryShop] = await Promise.all([
      getServerRequestHost(),
      getServerRequestShopParam(),
    ]);
    if (queryShop) {
      return {
        isStorefront: true,
        shopSlug: queryShop,
        host: serverHost,
      };
    }
    return resolveStorefrontHost(serverHost);
  }
  return getBrowserStorefrontContext();
}

export async function loadStorefrontTenant(): Promise<StorefrontTenant> {
  const context = await getCurrentStorefrontHostContext();
  if (!context.isStorefront) {
    return { context, shop: null };
  }

  const res = await apiFetch("/api/storefront/tenant");
  if (!res.ok) {
    if (import.meta.env.SSR && res.status === 404) {
      const { setServerResponseStatus } = await import("@/lib/api/ssr-cookies");
      await setServerResponseStatus(404);
    }
    return { context, shop: null };
  }
  const data = (await res.json()) as { shop: PublicStorefrontShop | null };
  return { context, shop: data.shop };
}
