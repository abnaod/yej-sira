import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { getBetterAuthTrustedOrigins, getEnv, getShopSubdomainBaseDomain } from "../../lib/env";
import { prisma } from "../../lib/db";

const env = getEnv();

const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
const googleOAuth =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined;

/**
 * In production, OAuth redirect URIs use `BETTER_AUTH_URL` as-is.
 * In dev, derive the API origin from the request `Host` so it matches the hostname
 * the browser used (`localhost` vs `127.0.0.1`). Mismatch breaks OAuth: the state
 * cookie is set on one host while Google redirects to the other → `state_mismatch`.
 */
const baseURL =
  env.NODE_ENV === "production"
    ? env.BETTER_AUTH_URL
    : {
        allowedHosts: ["localhost", "localhost:*", "127.0.0.1", "127.0.0.1:*"],
        protocol: "http" as const,
        fallback: env.BETTER_AUTH_URL,
      };

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  ...(googleOAuth ? { socialProviders: googleOAuth } : {}),
  secret: env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: getBetterAuthTrustedOrigins(),
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    ...(env.NODE_ENV === "production"
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: env.SHOP_COOKIE_DOMAIN ?? getShopSubdomainBaseDomain(),
          },
        }
      : {}),
  },
  experimental: {
    joins: true,
  },
});
