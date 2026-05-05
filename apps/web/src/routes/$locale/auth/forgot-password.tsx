import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/$locale/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { locale } = Route.useParams();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const redirectTo = `${window.location.origin}/${locale}/auth/reset-password`;
      const client = authClient as unknown as {
        requestPasswordReset: (args: { email: string; redirectTo: string }) => Promise<unknown>;
      };
      await client.requestPasswordReset({ email: email.trim(), redirectTo });
      setStatus("If that email exists, a reset link has been sent.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your account email and we will send a reset link.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      {status ? <p className="mt-4 text-sm text-muted-foreground">{status}</p> : null}
    </main>
  );
}
