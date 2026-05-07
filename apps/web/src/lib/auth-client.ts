import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

import { getApiOrigin } from "./api/origin";

const authBaseURL = getApiOrigin();
if (typeof window !== "undefined") {
  console.info("[auth-client] configured", {
    baseURL: authBaseURL,
    href: window.location.href,
  });
}

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
    onRequest: (context) => {
      console.info("[auth-client] request", {
        url: context.url,
      });
    },
    onResponse: (context) => {
      console.info("[auth-client] response", {
        url: context.response.url,
        status: context.response.status,
        redirected: context.response.redirected,
      });
    },
    onError: (context) => {
      console.warn("[auth-client] fetch error", context.error);
    },
  },
  plugins: [genericOAuthClient()],
});
