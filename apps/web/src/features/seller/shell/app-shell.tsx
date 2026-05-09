import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  Palette,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { apiFetchJson } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
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
  const isMessagesPath = matchesSellPath(pathname, locale, "/messages");

  return (
    <SidebarProvider>
      <SellerAppSidebar shop={shopQuery.data.shop} />
      <SidebarInset>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-6",
            showHeader && "gap-4",
            isMessagesPath
              ? "px-0 pt-0 lg:px-6 lg:pt-3"
              : "px-4 pt-2 sm:px-6 sm:pt-3",
          )}
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
      <SellerPortalBottomNav pathname={pathname} locale={locale} />
    </SidebarProvider>
  );
}

function matchesSellPath(pathname: string, locale: Locale, suffix: string) {
  const prefix = `/${locale}/sell`;
  return pathname === `${prefix}${suffix}` || pathname.startsWith(`${prefix}${suffix}/`);
}

function SellerPortalBottomNav({
  pathname,
  locale,
}: {
  pathname: string;
  locale: Locale;
}) {
  const items = [
    {
      label: "Dashboard",
      to: "/$locale/sell/dashboard" as const,
      active: matchesSellPath(pathname, locale, "/dashboard"),
      icon: LayoutDashboard,
    },
    {
      label: "Orders",
      to: "/$locale/sell/orders" as const,
      active: matchesSellPath(pathname, locale, "/orders"),
      icon: ShoppingBag,
    },
    {
      label: "Messages",
      to: "/$locale/sell/messages" as const,
      active: matchesSellPath(pathname, locale, "/messages"),
      icon: MessageSquare,
    },
    {
      label: "Listings",
      to: "/$locale/sell/listings" as const,
      active: matchesSellPath(pathname, locale, "/listings"),
      icon: Package,
      search: { new: false, edit: undefined },
    },
    {
      label: "Storefront",
      to: "/$locale/sell/storefront" as const,
      active: matchesSellPath(pathname, locale, "/storefront"),
      icon: Palette,
    },
  ];

  return (
    <nav
      aria-label="Shop portal navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(0,0,0,0.04)] md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {items.map((item) => (
          <li key={item.label} className="contents">
            <Link
              to={item.to}
              params={{ locale }}
              search={item.search}
              className={sellerBottomNavOuterClass}
              aria-current={item.active ? "page" : undefined}
            >
              <span className={sellerBottomNavInnerClass(item.active)}>
                <item.icon className="size-4" aria-hidden />
                <span className="min-w-0 max-w-full truncate text-[10px] leading-none">{item.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const sellerBottomNavOuterClass = cn(
  "group flex h-full w-full items-center justify-center",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
);

function sellerBottomNavInnerClass(isActive: boolean) {
  return cn(
    "flex h-14 w-20 max-w-full shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-center transition-colors",
    isActive
      ? "bg-muted text-primary"
      : "text-muted-foreground group-hover:text-foreground",
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
