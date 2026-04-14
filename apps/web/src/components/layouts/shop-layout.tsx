import { Outlet } from "@tanstack/react-router";

/** Seller portal: no store header/footer; full-height for `sell/route` + sidebar shell. */
export function SellerLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Outlet />
    </div>
  );
}
