import { Link } from "@tanstack/react-router";

export function HeaderNav() {
  return (
    <nav className="flex items-center gap-4 text-sm text-neutral-600">
      <Link to="/cart" className="hover:text-neutral-900">
        Cart
      </Link>
    </nav>
  );
}
