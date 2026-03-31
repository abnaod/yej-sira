import { SlidersHorizontal } from "lucide-react";

import { FilterChip } from "@/components/ui/filter-chip";

const filters = [
  { label: "Style" },
  { label: "Price" },
  { label: "Ships from" },
  { label: "Material" },
  { label: "Occasion" },
  { label: "Gift ready" },
];

export function CategoryToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      {filters.map((filter) => (
        <FilterChip key={filter.label} label={filter.label} />
      ))}

      <FilterChip
        label="All Filters"
        hasDropdown={false}
      />

      <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span>Sort by</span>
      </div>
    </div>
  );
}
