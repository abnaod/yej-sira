import { createContext, useContext } from "react";

import type { StorefrontTenant } from "@/lib/storefront-tenant";

const StorefrontTenantContext = createContext<StorefrontTenant | null>(null);

export function StorefrontTenantProvider({
  value,
  children,
}: {
  value: StorefrontTenant;
  children: React.ReactNode;
}) {
  return (
    <StorefrontTenantContext.Provider value={value}>
      {children}
    </StorefrontTenantContext.Provider>
  );
}

export function useStorefrontTenant() {
  return useContext(StorefrontTenantContext);
}

export function useActiveStorefrontShop() {
  const tenant = useStorefrontTenant();
  return tenant?.context.isStorefront ? tenant.shop : null;
}
