import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type ResetPasswordSearch = {
  token?: string;
};

export const Route = createFileRoute("/$locale/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { locale } = Route.useParams();
  const { token } = Route.useSearch();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing or invalid reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const client = authClient as unknown as {
        resetPassword: (args: {
          newPassword: string;
          token: string;
        }) => Promise<{ error?: { message?: string } | null }>;
      };
      const result = await client.resetPassword({ newPassword: password, token });
      if (result?.error) {
        setError(result.error.message ?? "Could not reset password.");
        return;
      }
      setDone(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      {done ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Your password has been reset. You can now sign in.
          </p>
          <Link
            to="/$locale"
            params={{ locale }}
            className="text-sm font-medium underline underline-offset-4"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-password-new">New password</Label>
            <Input
              id="reset-password-new"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-password-confirm">Confirm password</Label>
            <Input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
    </main>
  );
}
