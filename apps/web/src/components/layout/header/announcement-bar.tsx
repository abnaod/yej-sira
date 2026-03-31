import { ChevronDown, Phone } from "lucide-react";

import { Link } from "@tanstack/react-router";

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          <span>+001234567890</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-center">
          <span>Support makers · Free shipping $35+</span>
          <span className="mx-1">|</span>
          <Link to="/" className="font-medium underline underline-offset-2">
            Shop handmade
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            Eng
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 transition-opacity hover:opacity-80"
          >
            Location
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
