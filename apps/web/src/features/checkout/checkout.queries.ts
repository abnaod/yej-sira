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

export async function postCheckout(body: CheckoutBody): Promise<CheckoutResponse> {
  return apiFetchJson<CheckoutResponse>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function checkoutMutationOptions(
  queryClient: QueryClient,
  callbacks: {
    onSuccess?: (data: CheckoutResponse) => void;
    onError?: (err: unknown) => void;
  } = {},
) {
  return mutationOptions({
    mutationKey: ["checkout"] as const,
    mutationFn: postCheckout,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      callbacks.onSuccess?.(data);
    },
    onError: callbacks.onError,
  });
}
