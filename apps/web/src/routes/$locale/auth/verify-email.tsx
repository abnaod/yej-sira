import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getApiOrigin } from "@/lib/api/origin";

type VerifyEmailSearch = {
  token?: string;
  error?: string;
};

export const Route = createFileRoute("/$locale/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { locale } = Route.useParams();
  const search = Route.useSearch();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const onResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const client = authClient as unknown as {
        sendVerificationEmail: (args: {
          email: string;
          callbackURL: string;
        }) => Promise<unknown>;
      };
      await client.sendVerificationEmail({
        email: email.trim(),
        callbackURL: `${getApiOrigin()}`.replace(/\/$/, ""),
      });
      setStatus("If that email is pending verification, a new link has been sent.");
    } finally {
      setPending(false);
    }
  };

  const verifying = !!search.token && !search.error;

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold">Verify your email</h1>

      {verifying ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Your email is being verified…
          </p>
        </div>
      ) : search.error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          Verification failed: {search.error}. Request a new link below.
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email to receive a new verification link.
        </p>
      )}

      <form className="mt-6 space-y-4" onSubmit={onResend}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="verify-email">Email</Label>
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Sending…" : "Resend verification email"}
        </Button>
      </form>

      {status ? <p className="mt-4 text-sm text-muted-foreground">{status}</p> : null}

      <div className="mt-6">
        <Link
          to="/$locale"
          params={{ locale }}
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
