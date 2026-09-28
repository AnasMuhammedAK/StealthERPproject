import { z } from "zod";
import { UuidSchema } from "../primitives";

/** One line item as sent to place_order — matches p_items' expected JSON shape exactly. Extra keys (e.g. a client-supplied price) are ignored server-side, never trusted. */
export const PlaceOrderItemSchema = z.object({
  product_id: UuidSchema,
  qty: z.number().int().min(1).max(99),
});
export type PlaceOrderItem = z.infer<typeof PlaceOrderItemSchema>;

/**
 * public.place_order(p_slug, p_name, p_phone, p_note, p_items) — the sole
 * public order-request write path (20260922000300_place_order.sql).
 * Mirrors the function's own validation bounds:
 *   name 2..100 chars, phone 6..15 digits (non-digits stripped server-side),
 *   note ≤500 chars (empty becomes null), items 1..50 entries with no
 *   duplicate product_id.
 */
export const PlaceOrderInputSchema = z.object({
  p_slug: z.string().trim().min(1),
  p_name: z.string().trim().min(2).max(100),
  p_phone: z.string().min(6).max(20), // raw input; server strips non-digits then re-checks 6..15
  p_note: z.string().max(500), // client always sends a string (possibly empty), matching the generated Args type
  p_items: z
    .array(PlaceOrderItemSchema)
    .min(1)
    .max(50)
    .refine(
      (items) =>
        new Set(items.map((item) => item.product_id)).size === items.length,
      { message: "duplicate product_id in p_items" },
    ),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;

/** place_order()'s `returns uuid` — the new order's id. On failure the RPC raises one of PLACE_ORDER_ERROR_CODE_VALUES instead of returning. */
export const PlaceOrderOutputSchema = UuidSchema;
export type PlaceOrderOutput = z.infer<typeof PlaceOrderOutputSchema>;
