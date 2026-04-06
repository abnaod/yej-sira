import { AuthDialogProvider } from "@/components/auth";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Shared providers only. Per–route-group chrome lives under `$locale/(store)` and `$locale/(seller)`. */
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <AuthDialogProvider>{children}</AuthDialogProvider>
    </TooltipProvider>
  );
}
