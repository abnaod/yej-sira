import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categoriesQuery } from "@/features/store/home";
import { useLocale } from "@/lib/locale-path";

export function HeaderNav() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const { data, isPending, isError } = useQuery(categoriesQuery(locale));

  return (
    <nav className="hidden shrink-0 items-center gap-5 text-sm font-medium text-foreground md:flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-1 px-2.5 py-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            {t("categories")}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 min-w-48 overflow-y-auto">
          <DropdownMenuGroup>
            {isPending ? (
              <DropdownMenuItem disabled>{t("categoriesLoading")}</DropdownMenuItem>
            ) : isError ? (
              <DropdownMenuItem disabled>{t("categoriesError")}</DropdownMenuItem>
            ) : !data?.categories.length ? (
              <DropdownMenuItem disabled>{t("categoriesEmpty")}</DropdownMenuItem>
            ) : (
              data.categories.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link
                    to="/$locale/categories/$categoryId"
                    params={{ locale, categoryId: cat.slug }}
                    search={{
                    sort: "relevancy",
                    tagSlugs: "",
                    promotionSlug: undefined,
                    attributeDefinitionKey: undefined,
                    allowedValueKey: undefined,
                  }}
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
