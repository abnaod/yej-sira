import { getEnv } from "./env";

/** Flat fee for standard (address) delivery; pickup is always free. */
export function standardDeliveryFeeEtb(): number {
  return getEnv().STANDARD_DELIVERY_FEE_ETB;
}
