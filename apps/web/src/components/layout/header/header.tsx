import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderNav } from "./header-nav";

export function Header() {
  return (
    <header className="border-b border-border bg-white">
      <AnnouncementBar />
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="text-xl" aria-hidden>
            ✦
          </span>
          <span className="text-primary">Yej Sira</span>
        </Link>

        <HeaderNav />

        <div className="relative ml-auto flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for handmade, vintage, supplies…"
            className="pl-9 pr-3 shadow-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-primary"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </Link>
          <Link
            to="/cart"
            className="flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-primary"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
