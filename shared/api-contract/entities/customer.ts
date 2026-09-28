import { z } from "zod";
import { TimestampSchema, UuidSchema } from "../primitives";
import { ActiveStatusSchema } from "../enums";

/** public.customers row. Identity is per-shop (BR8): unique on (store_id, phone). Read-only to the owning vendor; only place_order (security definer) writes it. */
export const CustomerRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  phone: z.string(),
  name: z.string(),
  status: ActiveStatusSchema,
  created_at: TimestampSchema,
  last_active_at: TimestampSchema.nullable(),
});
export type CustomerRow = z.infer<typeof CustomerRowSchema>;
