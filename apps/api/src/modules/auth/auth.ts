import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";

import { getBetterAuthTrustedOrigins, getEnv, getShopSubdomainBaseDomain } from "../../lib/env";
import { prisma } from "../../lib/db";
import { sendEmail } from "../../lib/email/send-email";

const env = getEnv();

const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
const facebookClientId = env.FACEBOOK_CLIENT_ID?.trim();
const facebookClientSecret = env.FACEBOOK_CLIENT_SECRET?.trim();
const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim();
const telegramOidcClientId = env.TELEGRAM_OIDC_CLIENT_ID?.trim();
const telegramOidcClientSecret = env.TELEGRAM_OIDC_CLIENT_SECRET?.trim();

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (googleClientId && googleClientSecret) {
  socialProviders.google = { clientId: googleClientId, clientSecret: googleClientSecret };
}
if (facebookClientId && facebookClientSecret) {
  socialProviders.facebook = { clientId: facebookClientId, clientSecret: facebookClientSecret };
}
const hasSocialProviders = Object.keys(socialProviders).length > 0;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const telegramGenericOAuthPlugin =
  (telegramOidcClientId || telegramBotToken) && telegramOidcClientSecret
    ? genericOAuth({
        config: [
          {
            providerId: "telegram",
            clientId: telegramOidcClientId ?? telegramBotToken!.split(":")[0]!,
            clientSecret: telegramOidcClientSecret,
            authorizationUrl: "https://oauth.telegram.org/auth",
            tokenUrl: "https://oauth.telegram.org/token",
            issuer: "https://oauth.telegram.org",
            scopes: ["openid", "profile"],
            pkce: true,
            getUserInfo: async (tokens) => {
              const idToken = (tokens as { idToken?: string }).idToken;
              if (!idToken) return null;
              const claims = decodeJwtPayload(idToken);
              const sub = typeof claims?.sub === "string" ? claims.sub : null;
              if (!sub) return null;
              const name = typeof claims?.name === "string" ? claims.name : "Telegram user";
              const image = typeof claims?.picture === "string" ? claims.picture : undefined;
              return {
                id: sub,
                name,
                image,
                email: `${sub}@telegram.oidc`,
                emailVerified: false,
              };
            },
          },
        ],
      })
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
  account: {
    storeStateStrategy: "cookie",
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      strategy: "compact",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Yejsira password",
        text: `Reset your password using this link: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Yejsira email",
        text: `Verify your email using this link: ${url}`,
      });
    },
    sendOnSignUp: true,
  },
  ...(hasSocialProviders ? { socialProviders } : {}),
  ...(telegramGenericOAuthPlugin ? { plugins: [telegramGenericOAuthPlugin] } : {}),
  secret: env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: getBetterAuthTrustedOrigins(),
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    cookieOptions: {
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
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
