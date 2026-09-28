import { z } from "zod";
import {
  NonNegativeNumberSchema,
  TimestampSchema,
  UuidSchema,
} from "../primitives";

/** public.products row. `price` is optional and never shown to a customer directly (only via offers). */
export const ProductRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  name: z.string(),
  category_id: UuidSchema.nullable(),
  unit: z.string(),
  price: NonNegativeNumberSchema.nullable(),
  image_url: z.string().nullable(),
  available: z.boolean(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});
export type ProductRow = z.infer<typeof ProductRowSchema>;
