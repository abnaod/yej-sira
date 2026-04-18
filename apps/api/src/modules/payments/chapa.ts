import { getEnv } from "../../lib/env";

const CHAPA_INITIALIZE_PATH = "/v1/transaction/initialize";

/**
 * Chapa rejects initialize when `phone_number` is set but not 09xxxxxxxx / 07xxxxxxxx.
 * Omit the field unless we have a valid local mobile format.
 */
export function formatPhoneForChapa(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const digits = trimmed.replace(/\D/g, "");
  let local = digits;
  if (digits.startsWith("251") && digits.length >= 12) {
    local = `0${digits.slice(3, 12)}`;
  }
  if (/^09\d{8}$/.test(local) || /^07\d{8}$/.test(local)) {
    return local;
  }
  return undefined;
}
const CHAPA_VERIFY_PATH = "/v1/transaction/verify/";

type ChapaInitializeParams = {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
  meta?: Record<string, unknown>;
};

export type ChapaInitializeResponse = {
  checkout_url: string;
  tx_ref: string;
};

export type ChapaVerifyResponse = {
  ref_id: string;
  tx_ref: string;
  status: "success" | "failed" | "pending" | "cancelled";
  amount: string;
  currency: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
  meta: unknown;
  customization: {
    title: string | null;
    description: string | null;
  };
};

function formatChapaApiMessage(message: unknown): string {
  if (typeof message === "string") return message;
  if (message == null) return "";
  if (typeof message === "object") return JSON.stringify(message);
  return String(message);
}

async function chapaFetch(path: string, init?: RequestInit) {
  const env = getEnv();
  const url = `${env.CHAPA_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
      ...init?.headers,
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    let message: string;
    if (json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      if ("message" in j && j.message != null) {
        message = formatChapaApiMessage(j.message);
      } else {
        message = JSON.stringify(json);
      }
    } else {
      message = "";
    }
    if (!message) {
      message = `Chapa request failed with status ${res.status}`;
    }
    throw new Error(message);
  }
  if (!json || typeof json !== "object") {
    throw new Error("Invalid Chapa response body");
  }
  return json as { status: string; message: string; data: unknown };
}

/** Chapa requires amount as a string; hosted checkout does not take `payment_method` (customer picks on Chapa). */
export async function initializeTransaction(
  params: ChapaInitializeParams,
): Promise<ChapaInitializeResponse> {
  const { amount, ...rest } = params;
  const json = await chapaFetch(CHAPA_INITIALIZE_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...rest,
      amount: String(amount),
    }),
  });
  const data = json.data as Record<string, unknown> | null | undefined;
  const checkout_url =
    data && typeof data === "object" && "checkout_url" in data
      ? String((data as { checkout_url?: unknown }).checkout_url ?? "")
      : "";
  const tx_ref =
    data && typeof data === "object" && "tx_ref" in data
      ? String((data as { tx_ref?: unknown }).tx_ref ?? "")
      : "";
  if (!checkout_url) {
    throw new Error("Chapa did not return checkout_url");
  }
  return {
    checkout_url,
    tx_ref: tx_ref || params.tx_ref,
  };
}

function pendingVerifyResponse(txRef: string): ChapaVerifyResponse {
  return {
    ref_id: "",
    tx_ref: txRef,
    status: "pending",
    amount: "0",
    currency: "ETB",
    first_name: "",
    last_name: "",
    email: null,
    mobile: null,
    payment_method: "",
    created_at: "",
    updated_at: "",
    meta: null,
    customization: { title: null, description: null },
  };
}

/** Chapa uses inconsistent field names across docs (`ref_id` vs `reference`, `payment_method` vs `method`). */
function extractVerifyPayload(root: Record<string, unknown>): Record<string, unknown> {
  const inner = root.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  if (
    typeof root.tx_ref === "string" ||
    typeof root.trx_ref === "string" ||
    typeof root.reference === "string"
  ) {
    return root;
  }
  throw new Error("Chapa verify did not return transaction data");
}

function normalizeChapaPaymentStatus(raw: unknown): ChapaVerifyResponse["status"] {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "success" || s === "successful") return "success";
  if (s === "pending") return "pending";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "failed" || s === "failure") return "failed";
  return "failed";
}

export async function verifyTransaction(txRef: string): Promise<ChapaVerifyResponse> {
  const env = getEnv();
  const url = `${env.CHAPA_BASE_URL}${CHAPA_VERIFY_PATH}${encodeURIComponent(txRef)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
    },
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 404) {
      const msg =
        json && typeof json === "object" && "message" in json && json.message != null
          ? formatChapaApiMessage((json as Record<string, unknown>).message)
          : "";
      const lower = msg.toLowerCase();
      if (
        lower.includes("not found") ||
        lower.includes("invalid transaction") ||
        lower.includes("transaction not found")
      ) {
        throw new Error(msg || "Transaction not found");
      }
      if (
        !msg.trim() ||
        lower.includes("not paid") ||
        lower.includes("payment not paid") ||
        lower.includes("payment not paid yet")
      ) {
        return pendingVerifyResponse(txRef);
      }
      throw new Error(msg || `Chapa verify failed with status ${res.status}`);
    }
    let message: string;
    if (json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      message =
        "message" in j && j.message != null ? formatChapaApiMessage(j.message) : JSON.stringify(json);
    } else {
      message = "";
    }
    if (!message) {
      message = `Chapa request failed with status ${res.status}`;
    }
    throw new Error(message);
  }

  if (!json || typeof json !== "object") {
    throw new Error("Invalid Chapa response body");
  }

  const root = json as Record<string, unknown>;
  const data = extractVerifyPayload(root);
  const refId = data.ref_id ?? data.reference;
  const txRefOut = data.tx_ref ?? data.trx_ref ?? txRef;
  const paymentMethod = data.payment_method ?? data.method;

  return {
    ref_id: String(refId ?? ""),
    tx_ref: String(txRefOut ?? ""),
    status: normalizeChapaPaymentStatus(data.status),
    amount: String(data.amount ?? "0"),
    currency: String(data.currency ?? "ETB"),
    first_name: String(data.first_name ?? ""),
    last_name: String(data.last_name ?? ""),
    email: data.email ? String(data.email) : null,
    mobile: data.mobile ? String(data.mobile) : null,
    payment_method: String(paymentMethod ?? ""),
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
    meta: data.meta ?? null,
    customization: {
      title: (data.customization as { title?: string | null } | null)?.title ?? null,
      description:
        (data.customization as { description?: string | null } | null)?.description ?? null,
    },
  };
}
