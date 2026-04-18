import { AuthDialogProvider } from "@/features/shared/auth";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Shared providers only. Per–route-group chrome lives under `$locale/(store)` and `$locale/(seller)`. */
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <AuthDialogProvider>
        {children}
        <Toaster position="bottom-right" />
      </AuthDialogProvider>
    </TooltipProvider>
  );
}
