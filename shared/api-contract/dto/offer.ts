import { z } from "zod";
import { NonNegativeNumberSchema, UuidSchema } from "../primitives";

/** Add offer (OFFR-01). today_price_label is required — a vendor always types *something* for today's price; regular_price_label is optional context. */
export const CreateOfferInputSchema = z.object({
  store_id: UuidSchema,
  product_id: UuidSchema,
  today_price_label: z.string().trim().min(1),
  regular_price_label: z.string().trim().min(1).nullable().optional(),
  offer_price: NonNegativeNumberSchema.nullable().optional(),
  regular_price: NonNegativeNumberSchema.nullable().optional(),
});
export type CreateOfferInput = z.infer<typeof CreateOfferInputSchema>;
