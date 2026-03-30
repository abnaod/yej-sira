import { ShopLayout } from "./shop-layout";

/** Re-export shell; swap implementation later if HTML shell vs shop chrome split. */
export function RootLayout({ children }: { children: React.ReactNode }) {
  return <ShopLayout>{children}</ShopLayout>;
}
