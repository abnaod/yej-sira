import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categoriesQuery } from "@/features/storefront";

export function HeaderNav() {
  const { data, isPending, isError } = useQuery(categoriesQuery());

  return (
    <nav className="hidden shrink-0 items-center gap-5 text-sm font-medium text-foreground md:flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-1 px-2.5 py-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            Categories
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 min-w-48 overflow-y-auto">
          <DropdownMenuGroup>
            {isPending ? (
              <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
            ) : isError ? (
              <DropdownMenuItem disabled>Couldn’t load categories</DropdownMenuItem>
            ) : !data?.categories.length ? (
              <DropdownMenuItem disabled>No categories yet</DropdownMenuItem>
            ) : (
              data.categories.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link
                    to="/categories/$categoryId"
                    params={{ categoryId: cat.slug }}
                    search={{ sort: "relevancy", tagSlugs: "", promotionSlug: undefined }}
                  >
                    {cat.name}
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
