import { atom } from "jotai";

import type { PaymentMethod } from "./components/payment-method-step";
import type { DeliveryMethod } from "./types";

export type { PaymentMethod };

export type ShippingAddress = {
  city: string;
  subcity: string;
  woreda: string;
  kebele: string;
  specificLocation: string;
};

export type BuyerInfo = {
  fullName: string;
  email: string;
  phone: string;
};

export type CheckoutStep = "account" | "delivery" | "payment-method";

export const checkoutShippingAtom = atom<ShippingAddress | null>(null);
export const checkoutDeliveryMethodAtom = atom<DeliveryMethod>("standard");
export const checkoutPickupLocationIdAtom = atom<string | null>(null);
export const checkoutPaymentMethodAtom = atom<PaymentMethod>("chapa");

export const checkoutBuyerAtom = atom<BuyerInfo>({
  fullName: "",
  email: "",
  phone: "",
});

export const checkoutStepAtom = atom<CheckoutStep>("account");
