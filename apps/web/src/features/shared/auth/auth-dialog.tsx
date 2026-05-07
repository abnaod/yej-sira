import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
      {...props}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
      {...props}
    >
      <path
        fill="#229ED9"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"
      />
      <path
        fill="#fff"
        d="M16.84 7.35c.16-.04.31.1.27.28l-1.54 8.08c-.03.15-.2.22-.33.14l-2.51-1.75-1.28 1.36c-.12.13-.34.07-.38-.1l-.56-2.45-2.35-.86c-.19-.07-.2-.34-.02-.43l8.7-4.27Zm-2.22 2.22-3.53 2.93.38 1.65.42-1.14a.4.4 0 0 1 .14-.19l2.59-3.25Z"
      />
    </svg>
  );
}

function getDefaultCallbackUrl() {
  if (typeof window === "undefined") return "/";
  return `${window.location.origin}/`;
}

function getSellerPortalCallbackUrl(locale: Locale) {
  if (typeof window === "undefined") return "/";
  return `${window.location.origin}/${locale}/sell`;
}

function formatAuthError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return "Something went wrong. Try again.";
}

export type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectToSellerPortal?: boolean;
  /**
   * "checkout" renders the Etsy-style layout with "Continue as a guest" as the
   * primary CTA above the sign-in/register form.
   */
  mode?: "default" | "checkout";
  onContinueAsGuest?: () => void;
  /** Invoked after a successful sign-in (email or OAuth). */
  onSignInSuccess?: () => void;
};

export function AuthDialog({
  open,
  onOpenChange,
  redirectToSellerPortal = false,
  mode = "default",
  onContinueAsGuest,
  onSignInSuccess,
}: AuthDialogProps) {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [regFirstName, setRegFirstName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [oauthError, setOauthError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setLoginEmail("");
      setLoginPassword("");
      setRegFirstName("");
      setRegEmail("");
      setRegPassword("");
      setError(null);
      setOauthError(null);
      setTab("login");
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOauthError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.signIn.email({
        email: loginEmail.trim(),
        password: loginPassword,
        callbackURL: redirectToSellerPortal
          ? getSellerPortalCallbackUrl(locale)
          : getDefaultCallbackUrl(),
      });
      if (err) {
        setError(formatAuthError(err));
        return;
      }
      if (redirectToSellerPortal) {
        void navigate({ to: "/$locale/sell", params: { locale } });
      }
      onSignInSuccess?.();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  const oauthCallbackUrl = redirectToSellerPortal
    ? getSellerPortalCallbackUrl(locale)
    : getDefaultCallbackUrl();

  const handleGoogle = async () => {
    setError(null);
    setOauthError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.signIn.social({
        provider: "google",
        callbackURL: oauthCallbackUrl,
      });
      if (err) {
        setOauthError(formatAuthError(err));
      }
    } finally {
      setPending(false);
    }
  };

  const handleTelegram = async () => {
    setError(null);
    setOauthError(null);
    setPending(true);
    try {
      console.info("[telegram-oauth] start", {
        callbackURL: oauthCallbackUrl,
        href: typeof window !== "undefined" ? window.location.href : null,
      });
      const res = await fetch("/api/auth/sign-in/oauth2", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: "telegram",
          callbackURL: oauthCallbackUrl,
          disableRedirect: true,
        }),
      });
      console.info("[telegram-oauth] response", {
        url: res.url,
        status: res.status,
        redirected: res.redirected,
      });
      const data = (await res.json().catch(async () => {
        const text = await res.text().catch(() => "");
        return { text };
      })) as { url?: string; error?: string; message?: string; text?: string };
      console.info("[telegram-oauth] result", data);
      if (!res.ok) {
        setOauthError(data.error ?? data.message ?? res.statusText);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setOauthError("Telegram did not return an authorization URL.");
    } catch (err) {
      console.error("[telegram-oauth] thrown", err);
      setOauthError(formatAuthError(err));
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOauthError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.signUp.email({
        email: regEmail.trim(),
        password: regPassword,
        name: regFirstName.trim(),
        callbackURL: redirectToSellerPortal
          ? getSellerPortalCallbackUrl(locale)
          : getDefaultCallbackUrl(),
      });
      if (err) {
        setError(formatAuthError(err));
        return;
      }
      if (redirectToSellerPortal) {
        void navigate({ to: "/$locale/sell", params: { locale } });
      }
      onSignInSuccess?.();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  const switchAuthMode = (next: "login" | "register") => {
    setTab(next);
    setError(null);
    setOauthError(null);
  };

  const isCheckout = mode === "checkout";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-6 p-8 pb-6">
        <DialogHeader className="gap-1.5">
          <DialogTitle>
            {isCheckout
              ? "Go to checkout"
              : tab === "login"
                ? "Sign in to your account"
                : "Create your YEJSIRA account"}
          </DialogTitle>
          {!isCheckout && (
            <DialogDescription>
              Sign in or create an account to shop and track orders.
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogBody className="flex-none max-h-[85dvh] py-2">
          <div className="flex flex-col gap-6">
            {isCheckout && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full text-sm"
                  disabled={pending}
                  onClick={() => {
                    onContinueAsGuest?.();
                    onOpenChange(false);
                  }}
                >
                  Continue as a guest
                </Button>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="whitespace-nowrap text-sm text-muted-foreground">
                    OR
                  </span>
                  <Separator className="flex-1" />
                </div>
                <p className="text-base font-semibold">Sign in or register</p>
              </>
            )}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full text-sm text-foreground hover:text-foreground"
                disabled={pending}
                onClick={() => void handleGoogle()}
              >
                <GoogleIcon className="size-4 shrink-0" />
                {tab === "login" ? "Sign in with Google" : "Sign up with Google"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full text-sm text-foreground hover:text-foreground"
                disabled={pending}
                onClick={() => void handleTelegram()}
              >
                <TelegramIcon className="size-4 shrink-0" />
                {tab === "login" ? "Sign in with Telegram" : "Sign up with Telegram"}
              </Button>
              {oauthError && (
                <p className="text-sm text-destructive" role="alert">
                  {oauthError}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  Or with email
                </span>
                <Separator className="flex-1" />
              </div>
            </div>
            <div>
              {tab === "login" ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="auth-login-email">Email</Label>
                    <Input
                      id="auth-login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="auth-login-password">Password</Label>
                      <Link
                        to="/$locale/auth/forgot-password"
                        params={{ locale }}
                        className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => onOpenChange(false)}
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id="auth-login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending}
                    className="text-sm"
                  >
                    {pending ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="auth-reg-first">First name</Label>
                    <Input
                      id="auth-reg-first"
                      type="text"
                      autoComplete="given-name"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="auth-reg-email">Email</Label>
                    <Input
                      id="auth-reg-email"
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="auth-reg-password">Password</Label>
                    <Input
                      id="auth-reg-password"
                      type="password"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending}
                    className="text-sm"
                  >
                    {pending ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              )}
            </div>

            <div>
              {tab === "login" ? (
                <p className="text-center text-sm text-muted-foreground">
                  New to YEJSIRA?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm font-medium"
                    onClick={() => switchAuthMode("register")}
                  >
                    Create account
                  </Button>
                </p>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm font-medium"
                    onClick={() => switchAuthMode("login")}
                  >
                    Sign in
                  </Button>
                </p>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
