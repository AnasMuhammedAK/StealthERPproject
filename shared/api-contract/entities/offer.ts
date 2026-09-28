import { z } from "zod";
import {
  IsoDateSchema,
  NonNegativeNumberSchema,
  TimestampSchema,
  UuidSchema,
} from "../primitives";

/** public.offers row. today_price_label/regular_price_label are the vendor's free-typed display strings (D-16); offer_price/regular_price/saving/starts_at/ends_at are the numeric model added in Phase 01.1. One row per (product_id, offer_date). */
export const OfferRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  product_id: UuidSchema,
  today_price_label: z.string(),
  regular_price_label: z.string().nullable(),
  offer_price: NonNegativeNumberSchema.nullable(),
  regular_price: z.number().nullable(),
  saving: z.number().nullable(),
  offer_date: IsoDateSchema,
  starts_at: TimestampSchema.nullable(),
  ends_at: TimestampSchema.nullable(),
  created_at: TimestampSchema,
});
export type OfferRow = z.infer<typeof OfferRowSchema>;
