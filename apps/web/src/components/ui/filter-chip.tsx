import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  active,
  hasDropdown = true,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-white text-foreground hover:bg-neutral-50",
        className,
      )}
    >
      {label}
      {hasDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
    </button>
  );
}
