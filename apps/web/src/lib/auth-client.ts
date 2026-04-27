import { createAuthClient } from "better-auth/react";
import { telegramClient } from "better-auth-telegram/client";

import { getApiOrigin } from "./api/origin";

export const authClient = createAuthClient({
  baseURL: getApiOrigin(),
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [telegramClient()],
});
