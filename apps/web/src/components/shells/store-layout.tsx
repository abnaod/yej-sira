import { Outlet } from "@tanstack/react-router";

import { ContentContainer } from "@/components/layout/content-container";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer/footer";
import { Header } from "@/components/layout/header/header";

/** Storefront chrome: header, constrained content, footer. Used only under `/$locale/(store)/…`. */
export function StoreLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <ContentContainer>
        <Outlet />
      </ContentContainer>
      <Footer />
      <CookieBanner />
    </div>
  );
}
