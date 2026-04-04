import type { Locale } from "@ys/intl";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type CheckoutResponse = {
  order: {
    id: string;
    status: string;
    total: number;
  };
};

export type CheckoutBody = {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export async function postCheckout(body: CheckoutBody, locale: Locale): Promise<CheckoutResponse> {
  return apiFetchJson<CheckoutResponse>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    locale,
  });
}

export function checkoutMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  callbacks: {
    onSuccess?: (data: CheckoutResponse) => void;
    onError?: (err: unknown) => void;
  } = {},
) {
  return mutationOptions({
    mutationKey: ["checkout", locale] as const,
    mutationFn: (body: CheckoutBody) => postCheckout(body, locale),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["cart", locale] });
      void queryClient.invalidateQueries({ queryKey: ["orders", locale] });
      callbacks.onSuccess?.(data);
    },
    onError: callbacks.onError,
  });
}
