import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { apiFetchJson } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";
import { currentUserQuery } from "@/features/shared/current-user.queries";

import { SellerAppSidebar } from "./app-sidebar";
import {
  sellerPortalHeaderSubtitle,
  sellerPortalHeaderTitle,
} from "./breadcrumb";
import { myShopQuery } from "../shared/shop.queries";

export function SellerAppShell() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const shopQuery = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const meQuery = useQuery({
    ...currentUserQuery(),
    enabled: !!session?.user,
  });

  // Redirect to landing page when the client-side fetch confirms no shop.
  useEffect(() => {
    if (sessionPending) return;
    if (!session?.user) {
      void navigate({ to: "/$locale/sell/onboarding", params: { locale } });
      return;
    }
    if (!shopQuery.isLoading && !shopQuery.data?.shop) {
      void navigate({ to: "/$locale/sell/onboarding", params: { locale } });
    }
  }, [sessionPending, session?.user, shopQuery.isLoading, shopQuery.data, navigate, locale]);

  // Show nothing while session / shop data is loading to avoid layout flash.
  if (
    sessionPending ||
    !session?.user ||
    shopQuery.isLoading ||
    meQuery.isLoading ||
    !shopQuery.data?.shop
  ) {
    return null;
  }

  if (meQuery.data?.user.mustChangePassword) {
    return <ForcedPasswordChange />;
  }

  const title = sellerPortalHeaderTitle(pathname, locale);
  const subtitle = sellerPortalHeaderSubtitle(pathname, locale);
  const showHeader = title.length > 0 || subtitle.length > 0;

  return (
    <SidebarProvider>
      <SellerAppSidebar />
      <SidebarInset>
        <div
          className={
            showHeader
              ? "flex min-h-0 flex-1 flex-col gap-4 px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6"
              : "flex min-h-0 flex-1 flex-col px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6"
          }
        >
          {showHeader ? (
            <div className="shrink-0 space-y-0.5">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-xss text-muted-foreground">{subtitle}</p>
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ForcedPasswordChange() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (newPassword: string) =>
      apiFetchJson<{ ok: true }>("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    mutation.mutate(password, {
      onError: (err) => setError(err instanceof Error ? err.message : "Could not update password"),
    });
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account was created by an admin. Choose a new password before managing your shop.
      </p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="forced-password">New password</Label>
          <Input
            id="forced-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="forced-password-confirm">Confirm password</Label>
          <Input
            id="forced-password-confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save password"}
        </Button>
      </form>
    </main>
  );
}
