import { z } from "zod";
import { TimestampSchema, UuidSchema } from "../primitives";
import { EventNameSchema } from "../enums";

/** public.events row. Append-only; entity ids carry no FK (D-07 — a deleted entity's id and a name snapshot in `props` must survive). Only readable by the owning vendor; only written through log_event(). */
export const EventRowSchema = z.object({
  id: UuidSchema,
  event_name: EventNameSchema,
  occurred_at: TimestampSchema,
  store_id: UuidSchema.nullable(),
  user_id: UuidSchema.nullable(),
  customer_id: UuidSchema.nullable(),
  visitor_id: z.string().nullable(),
  product_id: UuidSchema.nullable(),
  order_id: UuidSchema.nullable(),
  offer_id: UuidSchema.nullable(),
  app_version: z.string().nullable(),
  props: z.record(z.string(), z.unknown()).nullable(),
});
export type EventRow = z.infer<typeof EventRowSchema>;
