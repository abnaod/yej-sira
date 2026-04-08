import { z } from "zod";

export const checkoutBodySchema = z.discriminatedUnion("deliveryMethod", [
  z.object({
    deliveryMethod: z.literal("standard"),
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().max(32).optional(),
    city: z.string().min(1),
    subcity: z.string().min(1),
    woreda: z.string().min(1),
    kebele: z.string().min(1),
    specificLocation: z.string().min(1),
    paymentMethod: z.enum(["chapa", "telebirr", "cod"]),
  }),
  z.object({
    deliveryMethod: z.literal("pickup"),
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().max(32).optional(),
    pickupLocationId: z.string().min(1),
    paymentMethod: z.enum(["chapa", "telebirr", "cod"]),
  }),
]);
