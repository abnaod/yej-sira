import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { featureCartCheckout } from "@/lib/features";
import { useLocale } from "@/lib/locale-path";
import { Button } from "@/components/ui/button";

type VerifyResponse = {
  status: "completed" | "failed" | "cancelled" | "pending";
  orderId: string;
  txRef: string;
};

async function verifyPaymentRequest(input: {
  txRef?: string;
  orderId?: string;
  /** Guest checkout: HMAC token from return_url (query `token`). */
  orderAccessToken?: string;
}): Promise<VerifyResponse> {
  const tokenBody =
    input.orderAccessToken !== undefined
      ? { orderAccessToken: input.orderAccessToken }
      : {};
  const body =
    input.txRef !== undefined
      ? { tx_ref: input.txRef, ...tokenBody }
      : { orderId: input.orderId as string, ...tokenBody };
  return apiFetchJson<VerifyResponse>("/api/payments/chapa/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Chapa can briefly report `pending` right after redirect; poll until terminal or timeout. */
async function verifyPaymentWithRetries(input: {
  txRef?: string;
  orderId?: string;
  orderAccessToken?: string;
}): Promise<VerifyResponse> {
  const maxAttempts = 15;
  const delayMs = 2000;
  let last: VerifyResponse | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    last = await verifyPaymentRequest(input);
    if (last.status !== "pending") return last;
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return last!;
}

export const Route = createFileRoute("/$locale/(store)/payments/success/")({
  beforeLoad: ({ params }) => {
    if (!featureCartCheckout) {
      throw redirect({ to: "/$locale", params: { locale: params.locale } });
    }
  },
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<
    "verifying" | "success" | "failed" | "pending_slow" | "error"
  >("verifying");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const txRef =
      params.get("tx_ref") ??
      params.get("trx_ref") ??
      params.get("txRef") ??
      params.get("transaction_ref");
    const orderIdFromUrl = params.get("orderId") ?? params.get("order_id");
    /**
     * Some clients/email renderers turn `&` into `&amp;` when rewriting links.
     * That shows up as a literal `amp;token` key in `URLSearchParams`. Accept
     * both so the guest-checkout token survives a broken redirect chain.
     */
    const orderAccessToken =
      params.get("token") ??
      params.get("amp;token") ??
      undefined;
    if (orderAccessToken) {
      setGuestToken(orderAccessToken);
    }

    if (!txRef && !orderIdFromUrl) {
      setStatus("error");
      return;
    }

    const verifyInput = txRef
      ? { txRef, ...(orderAccessToken ? { orderAccessToken } : {}) }
      : { orderId: orderIdFromUrl!, ...(orderAccessToken ? { orderAccessToken } : {}) };

    void (async () => {
      try {
        const data = await verifyPaymentWithRetries(verifyInput);
        if (cancelled) return;
        void queryClient.invalidateQueries({ queryKey: ["cart", locale] });
        if (data.status === "completed") {
          setStatus("success");
          setOrderId(data.orderId);
        } else if (data.status === "pending") {
          setStatus("pending_slow");
          setOrderId(data.orderId);
        } else {
          setStatus("failed");
          setOrderId(data.orderId);
        }
      } catch {
        if (cancelled) return;
        void queryClient.invalidateQueries({ queryKey: ["cart", locale] });
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, queryClient]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        {status === "verifying" && (
          <>
            <h2 className="text-xl font-semibold">Verifying your payment...</h2>
            <p className="mt-2 text-muted-foreground">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Payment Successful!</h2>
            <p className="mt-2 text-muted-foreground">
              Your order has been confirmed and is being processed.
            </p>
            <Button
              className="mt-6"
              onClick={() =>
                void navigate(
                  guestToken
                    ? {
                        to: "/$locale/orders/by-token/$token",
                        params: { locale, token: guestToken },
                      }
                    : {
                        to: "/$locale/orders/$orderId",
                        params: { locale, orderId: orderId ?? "" },
                      },
                )
              }
            >
              View Order
            </Button>
          </>
        )}

        {status === "pending_slow" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-8 w-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Confirmation pending</h2>
            <p className="mt-2 text-muted-foreground">
              Your payment is still being confirmed. Check your order list in a moment — it will
              update when verification completes.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() =>
                void navigate(
                  guestToken
                    ? {
                        to: "/$locale/orders/by-token/$token",
                        params: { locale, token: guestToken },
                      }
                    : { to: "/$locale/orders", params: { locale } },
                )
              }
            >
              View Order{guestToken ? "" : "s"}
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Payment Failed</h2>
            <p className="mt-2 text-muted-foreground">
              Your payment could not be completed. You can retry from your order details.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() =>
                void navigate(
                  guestToken
                    ? {
                        to: "/$locale/orders/by-token/$token",
                        params: { locale, token: guestToken },
                      }
                    : { to: "/$locale/orders", params: { locale } },
                )
              }
            >
              View Order{guestToken ? "" : "s"}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Could Not Verify Payment</h2>
            <p className="mt-2 text-muted-foreground">
              We could not verify your payment status. Please check your order details or contact support.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() =>
                void navigate(
                  guestToken
                    ? {
                        to: "/$locale/orders/by-token/$token",
                        params: { locale, token: guestToken },
                      }
                    : { to: "/$locale/orders", params: { locale } },
                )
              }
            >
              View Order{guestToken ? "" : "s"}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
