import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

const navItems = [
  { label: "Categories", href: "/", hasDropdown: true },
  { label: "Gifts", href: "/" },
  { label: "New & notable", href: "/" },
  { label: "Gift cards", href: "/" },
] as const;

export function HeaderNav() {
  return (
    <nav className="hidden items-center gap-5 text-sm font-medium text-foreground md:flex">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className="flex items-center gap-1 transition-colors hover:text-primary"
        >
          {item.label}
          {"hasDropdown" in item && item.hasDropdown && (
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          )}
        </Link>
      ))}
    </nav>
  );
}
