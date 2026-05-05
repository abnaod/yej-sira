import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import "@/lib/i18n";
import { createDefaultQueryClient } from "@/lib/query-client";
import { initSentry } from "@/lib/sentry";

import { routeTree } from "./routeTree.gen";

void initSentry();

export function getRouter() {
  const queryClient = createDefaultQueryClient();
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
