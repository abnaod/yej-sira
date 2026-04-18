import { createAuthClient } from "better-auth/react";

import { getApiOrigin } from "./api/origin";

export const authClient = createAuthClient({
  baseURL: getApiOrigin(),
  basePath: "/api/auth",
});
