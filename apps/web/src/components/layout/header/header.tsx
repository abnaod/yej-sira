import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Heart,
  LogOut,
  MessageSquare,
  Shield,
  Store,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuthDialog } from "@/features/shared/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentUserQuery } from "@/features/shared/current-user.queries";
import { authClient } from "@/lib/auth-client";
import { featureConversations } from "@/lib/features";
import { useLocale } from "@/lib/locale-path";
import { BrandLogo } from "../brand-logo";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderFilter } from "./header-filter";
import { HeaderSearch } from "./header-search";
import { HeaderNav } from "./header-nav";

export function Header() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const navigate = useNavigate();
  const { openAuth } = useAuthDialog();
  const { data: session, isPending } = authClient.useSession();
  const meQuery = useQuery({
    ...currentUserQuery(),
    enabled: !!session?.user,
  });
  const isAdmin = meQuery.data?.user.role === "admin";

  const fullName = session?.user?.name?.trim();
  const displayName =
    fullName?.split(/\s+/)[0] ||
    session?.user?.email?.split("@")[0] ||
    t("account");

  return (
    <header className="border-b border-border bg-white">
      <AnnouncementBar />
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link
          to="/$locale"
          params={{ locale }}
          activeOptions={{ exact: true }}
          className="flex shrink-0 items-center"
        >
          <BrandLogo className="text-primary" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <HeaderNav />
          <div className="flex min-w-0 flex-1 items-center gap-0">
            <HeaderFilter />
            <HeaderSearch />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {isPending ? (
            <span className="flex items-center gap-1.5 px-1.5 py-1 text-sm text-muted-foreground">
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">{t("signIn")}</span>
            </span>
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 gap-1.5 px-2 text-sm font-normal text-foreground hover:text-primary"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden max-w-40 truncate sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                {featureConversations ? (
                  <DropdownMenuItem asChild>
                    <Link to="/$locale/messages" params={{ locale }}>
                      <MessageSquare />
                      {t("messages")}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link to="/$locale/sell" params={{ locale }}>
                    <Store />
                    {t("myShop")}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/$locale/admin/dashboard" params={{ locale }}>
                      <Shield />
                      {t("adminPortal", { defaultValue: "Admin portal" })}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    void authClient.signOut(
                      {},
                      {
                        onSuccess: () => {
                          void navigate({ to: "/$locale", params: { locale } });
                        },
                      },
                    );
                  }}
                >
                  <LogOut />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-9 gap-1.5 px-2 text-sm font-normal text-foreground hover:text-primary"
              onClick={() => openAuth()}
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">{t("signIn")}</span>
            </Button>
          )}
          {!isPending && session?.user && featureConversations && (
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 text-foreground hover:text-primary"
              asChild
            >
              <Link
                to="/$locale/messages"
                params={{ locale }}
                aria-label={t("messages")}
              >
                <MessageSquare className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          )}
          {!isPending && session?.user && (
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 text-foreground hover:text-primary"
              asChild
            >
              <Link
                to="/$locale/favorites"
                params={{ locale }}
                aria-label={t("favorites")}
              >
                <Heart className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
