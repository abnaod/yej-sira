import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createTelegramOIDCProvider, telegram } from "better-auth-telegram";

import { getBetterAuthTrustedOrigins, getEnv, getShopSubdomainBaseDomain } from "../../lib/env";
import { prisma } from "../../lib/db";
import { sendEmail } from "../../lib/email/send-email";

const env = getEnv();

const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
const facebookClientId = env.FACEBOOK_CLIENT_ID?.trim();
const facebookClientSecret = env.FACEBOOK_CLIENT_SECRET?.trim();
const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim();
const telegramBotUsername = env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
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

function dateFromExpiresIn(expiresIn: unknown): Date | undefined {
  const seconds = typeof expiresIn === "number" ? expiresIn : Number(expiresIn);
  return Number.isFinite(seconds) ? new Date(Date.now() + seconds * 1000) : undefined;
}

function createTelegramOidcProvider() {
  if (!(telegramBotToken && telegramOidcClientSecret)) return null;

  const baseProvider = createTelegramOIDCProvider(telegramBotToken, {
    clientId: telegramOidcClientId,
    clientSecret: telegramOidcClientSecret,
  });
  const clientId = telegramOidcClientId ?? telegramBotToken.split(":")[0]!;

  return {
    ...baseProvider,
    async validateAuthorizationCode(args: {
      code: string;
      codeVerifier?: string;
      redirectURI: string;
    }) {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: args.code,
        redirect_uri: args.redirectURI,
        client_id: clientId,
      });
      if (args.codeVerifier) {
        body.set("code_verifier", args.codeVerifier);
      }

      const res = await fetch("https://oauth.telegram.org/token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${clientId}:${telegramOidcClientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok || !data || data.error) {
        throw new Error(
          `Telegram token exchange failed: ${
            typeof data?.error === "string" ? data.error : res.statusText
          }`,
        );
      }

      return {
        tokenType: typeof data.token_type === "string" ? data.token_type : undefined,
        accessToken: typeof data.access_token === "string" ? data.access_token : undefined,
        refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : undefined,
        accessTokenExpiresAt: dateFromExpiresIn(data.expires_in),
        refreshTokenExpiresAt: dateFromExpiresIn(data.refresh_token_expires_in),
        scopes:
          typeof data.scope === "string"
            ? data.scope.split(" ")
            : Array.isArray(data.scope)
              ? data.scope.filter((scope): scope is string => typeof scope === "string")
              : [],
        idToken: typeof data.id_token === "string" ? data.id_token : undefined,
        raw: data,
      };
    },
  };
}

const telegramOidcProvider = createTelegramOidcProvider();

const telegramPlugin =
  telegramBotToken && telegramOidcClientSecret
    ? telegram({
        botToken: telegramBotToken,
        botUsername: telegramBotUsername ?? "telegram_oidc",
        loginWidget: false,
        oidc: {
          enabled: true,
          clientId: telegramOidcClientId,
          clientSecret: telegramOidcClientSecret,
        },
      })
    : undefined;
const telegramOidcBasicAuthPlugin: BetterAuthPlugin | null = telegramOidcProvider
  ? {
      id: "telegram-oidc-basic-auth",
      init: (ctx) => ({
        context: {
          socialProviders: [
            telegramOidcProvider,
            ...ctx.socialProviders.filter((provider) => provider.id !== telegramOidcProvider.id),
          ],
        },
      }),
    }
  : null;
const plugins: BetterAuthPlugin[] = [
  ...(telegramPlugin ? [telegramPlugin] : []),
  ...(telegramOidcBasicAuthPlugin ? [telegramOidcBasicAuthPlugin] : []),
];

function isLoopbackOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * In production, OAuth redirect URIs use `BETTER_AUTH_URL` as-is.
 * In dev with a public tunnel (ngrok), use `BETTER_AUTH_URL` too so Telegram
 * receives the registered HTTPS callback instead of the local proxy target.
 * In dev, derive the API origin from the request `Host` so it matches the hostname
 * the browser used (`localhost` vs `127.0.0.1`). Mismatch breaks OAuth: the state
 * cookie is set on one host while Google redirects to the other → `state_mismatch`.
 */
const baseURL =
  env.NODE_ENV === "production" || !isLoopbackOrigin(env.BETTER_AUTH_URL)
    ? env.BETTER_AUTH_URL
    : {
        allowedHosts: ["localhost", "localhost:*", "127.0.0.1", "127.0.0.1:*"],
        protocol: "http" as const,
        fallback: env.BETTER_AUTH_URL,
      };
const useSecureAuthCookies =
  env.NODE_ENV === "production" || env.BETTER_AUTH_URL.startsWith("https://");

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
  ...(plugins.length > 0 ? { plugins } : {}),
  secret: env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: getBetterAuthTrustedOrigins(),
  advanced: {
    useSecureCookies: useSecureAuthCookies,
    defaultCookieAttributes: {
      sameSite: useSecureAuthCookies ? "none" : "lax",
      secure: useSecureAuthCookies,
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
