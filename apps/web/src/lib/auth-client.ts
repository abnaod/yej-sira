import { createAuthClient } from "better-auth/react";
import { genericOAuthClient } from "better-auth/client/plugins";

import { getApiOrigin } from "./api/origin";

const authBaseURL = getApiOrigin();

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
    onError: (context) => {
      console.warn("[auth-client] fetch error", context.error);
    },
  },
  plugins: [genericOAuthClient()],
});
