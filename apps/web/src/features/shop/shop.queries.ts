import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import type { ProductCardDto } from "@/features/storefront/storefront.queries";
import { apiFetchJson } from "@/lib/api";

export type ShopPublicResponse = {
  shop: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
  };
  products: ProductCardDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const shopPublicQuery = (locale: Locale, shopSlug: string, page = 1, pageSize = 24) =>
  queryOptions({
    queryKey: ["shop", locale, shopSlug, page, pageSize] as const,
    queryFn: () =>
      apiFetchJson<ShopPublicResponse>(
        `/api/shops/${encodeURIComponent(shopSlug)}?page=${page}&pageSize=${pageSize}`,
        { locale },
      ),
  });
