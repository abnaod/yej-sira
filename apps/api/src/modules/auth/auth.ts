import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { telegram } from "better-auth-telegram";

import { getBetterAuthTrustedOrigins, getEnv, getShopSubdomainBaseDomain } from "../../lib/env";
import { prisma } from "../../lib/db";
import { sendEmail } from "../../lib/email/send-email";

const env = getEnv();

const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
const facebookClientId = env.FACEBOOK_CLIENT_ID?.trim();
const facebookClientSecret = env.FACEBOOK_CLIENT_SECRET?.trim();
const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim();
const telegramBotUsername = env.TELEGRAM_BOT_USERNAME?.trim();
const telegramOidcClientSecret = env.TELEGRAM_OIDC_CLIENT_SECRET?.trim();

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (googleClientId && googleClientSecret) {
  socialProviders.google = { clientId: googleClientId, clientSecret: googleClientSecret };
}
if (facebookClientId && facebookClientSecret) {
  socialProviders.facebook = { clientId: facebookClientId, clientSecret: facebookClientSecret };
}
const hasSocialProviders = Object.keys(socialProviders).length > 0;

/** https://github.com/vcode-sh/better-auth-telegram — OIDC only (no extra Prisma columns). */
const telegramAuthPlugin =
  telegramBotToken && telegramBotUsername && telegramOidcClientSecret
    ? telegram({
        botToken: telegramBotToken,
        botUsername: telegramBotUsername,
        loginWidget: false,
        oidc: {
          enabled: true,
          clientSecret: telegramOidcClientSecret,
        },
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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Yej-sira password",
        text: `Reset your password using this link: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Yej-sira email",
        text: `Verify your email using this link: ${url}`,
      });
    },
    sendOnSignUp: true,
  },
  ...(hasSocialProviders ? { socialProviders } : {}),
  ...(telegramAuthPlugin ? { plugins: [telegramAuthPlugin] } : {}),
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
