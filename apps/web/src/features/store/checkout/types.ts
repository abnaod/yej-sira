export type DeliveryMethod = "standard" | "pickup";

export interface ShippingFormValues {
  city: string;
  subcity: string;
  woreda: string;
  kebele: string;
  specificLocation: string;
}
