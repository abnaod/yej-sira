import { Link } from "@tanstack/react-router";

import { HeaderNav } from "./header-nav";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          yej-sira
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
