import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type DeliveryMethod = "standard" | "pickup";
export type PaymentMethod = "chapa" | "telebirr" | "cod";

export type CheckoutResponse = {
  order: {
    id: string;
    status: string;
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
    deliveryMethod: DeliveryMethod;
  };
  txRef: string;
};

export type CheckoutBody =
  | {
      deliveryMethod: "standard";
      fullName: string;
      email: string;
      phone?: string;
      city: string;
      subcity: string;
      woreda: string;
      kebele: string;
      specificLocation: string;
      paymentMethod: PaymentMethod;
    }
  | {
      deliveryMethod: "pickup";
      fullName: string;
      email: string;
      phone?: string;
      pickupLocationId: string;
      paymentMethod: PaymentMethod;
    };

export type PickupLocationDto = {
  id: string;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type PickupLocationsResponse = {
  locations: PickupLocationDto[];
};

export async function postCheckout(body: CheckoutBody, locale: Locale): Promise<CheckoutResponse> {
  return apiFetchJson<CheckoutResponse>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    locale,
  });
}

export const pickupLocationsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["pickupLocations", locale] as const,
    queryFn: () =>
      apiFetchJson<PickupLocationsResponse>("/api/pickup-locations", { locale }),
    staleTime: 60_000,
  });

export function checkoutMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  callbacks: {
    onSuccess?: (data: CheckoutResponse, variables: CheckoutBody) => void;
    onError?: (err: unknown) => void;
  } = {},
) {
  return mutationOptions({
    mutationKey: ["checkout", locale] as const,
    mutationFn: (body: CheckoutBody) => postCheckout(body, locale),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["orders", locale] });
      callbacks.onSuccess?.(data, variables);
    },
    onError: callbacks.onError,
  });
}
