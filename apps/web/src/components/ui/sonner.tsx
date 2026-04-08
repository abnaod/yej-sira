import type { CSSProperties } from "react";
import { useSyncExternalStore } from "react";
import {
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  ShoppingCart,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { cn } from "@/lib/utils";

function getResolvedTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function subscribeToTheme(callback: () => void) {
  if (typeof document === "undefined") return () => {};
  const root = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", callback);
  };
}

function useResolvedTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribeToTheme, getResolvedTheme, () => "light");
}

const neutralToast = cn(
  "rounded-lg border border-border bg-background text-foreground shadow-md",
  "[&_[data-description]]:text-muted-foreground",
);

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedTheme();

  return (
    <Sonner
      theme={theme}
      closeButton={false}
      className="toaster group"
      icons={{
        success: <ShoppingCart className="size-4 text-muted-foreground" aria-hidden />,
        info: <InfoIcon className="size-4 text-muted-foreground" />,
        warning: <TriangleAlertIcon className="size-4 text-muted-foreground" />,
        error: <OctagonXIcon className="size-4 text-muted-foreground" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast: neutralToast,
          success: neutralToast,
          error: neutralToast,
          warning: neutralToast,
          info: neutralToast,
        },
      }}
      style={
        {
          "--normal-bg": "var(--color-background)",
          "--normal-text": "var(--color-foreground)",
          "--normal-border": "var(--color-border)",
          "--border-radius": "var(--radius-lg)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
