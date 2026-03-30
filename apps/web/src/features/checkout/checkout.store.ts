import { atom } from "jotai";

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export type CheckoutStep = "shipping" | "payment" | "review";

export const checkoutShippingAtom = atom<ShippingAddress | null>(null);

export const checkoutStepAtom = atom<CheckoutStep>("shipping");
