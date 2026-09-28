import { z } from "zod";
import { UuidSchema } from "../primitives";
import { EventNameSchema } from "../enums";

/**
 * public.log_event(...) — the sole analytics write path
 * (20260923001000_log_event.sql). Silently resolves (no row written, no
 * error) when there is no resolvable actor or the actor is over the
 * 60-per-minute rate limit (D-04) — only an unknown p_event_name raises.
 */
export const LogEventInputSchema = z.object({
  p_event_name: EventNameSchema,
  p_slug: z.string().nullable().optional(),
  p_visitor_id: z.string().nullable().optional(),
  p_app_version: z.string().nullable().optional(),
  p_product_id: UuidSchema.nullable().optional(),
  p_order_id: UuidSchema.nullable().optional(),
  p_offer_id: UuidSchema.nullable().optional(),
  p_props: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type LogEventInput = z.infer<typeof LogEventInputSchema>;

/** log_event() `returns void`. */
export const LogEventOutputSchema = z.void();
export type LogEventOutput = z.infer<typeof LogEventOutputSchema>;
