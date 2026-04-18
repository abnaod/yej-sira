import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, MoreVertical, Shield, Store } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { currentUserQuery } from "@/features/shared/current-user.queries";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

function userInitials(name: string | null | undefined, email: string | null | undefined) {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  const e = email?.trim();
  if (e) return e.slice(0, 2).toUpperCase();
  return "?";
}

/** Bottom sidebar user block — matches [dashboard-01 `nav-user`](https://ui.shadcn.com/blocks#dashboard-01). */
export function SellerNavUser() {
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const { data: session, isPending } = authClient.useSession();
  const meQuery = useQuery({
    ...currentUserQuery(),
    enabled: !!session?.user,
  });
  const isAdmin = meQuery.data?.user.role === "admin";

  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!session?.user) {
    return null;
  }

  const u = session.user as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  const name = u.name?.trim() || u.email?.split("@")[0] || "Account";
  const email = u.email ?? "";
  const avatar = u.image?.trim() || undefined;
  const initials = userInitials(u.name, u.email);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={name}
            >
              <Avatar className="size-8 rounded-lg grayscale">
                {avatar ? <AvatarImage src={avatar} alt="" /> : null}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xss leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xxs text-muted-foreground">{email}</span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  {avatar ? <AvatarImage src={avatar} alt="" /> : null}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/$locale" params={{ locale }}>
                  <Store />
                  Storefront
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
            </DropdownMenuGroup>
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
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
