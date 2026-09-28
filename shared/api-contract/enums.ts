/**
 * Every value below is enforced by a live CHECK constraint, table column
 * default, or an allow-list inside a security-definer function. The
 * migration cited per enum is the authority; this file must never drift
 * wider or narrower than it.
 */

import { z } from "zod";

/** stores.status / customers.status — 20260923000700_beta_core_records.sql */
export const ACTIVE_STATUS_VALUES = ["active", "inactive"] as const;
export const ActiveStatusSchema = z.enum(ACTIVE_STATUS_VALUES);
export type ActiveStatus = z.infer<typeof ActiveStatusSchema>;

/** orders.status — 20260923000700_beta_core_records.sql (transition legality is NOT enforced in the DB; only Confirm/Cancel/Complete UI actions create transitions) */
export const ORDER_STATUS_VALUES = [
  "new",
  "confirmed",
  "cancelled",
  "completed",
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUS_VALUES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/** orders.rejection_reason — 20260927000100_order_rejection_reason.sql (nullable; null means no reason recorded) */
export const ORDER_REJECTION_REASON_VALUES = [
  "out_of_stock",
  "customer_unreachable",
  "mistake",
  "other",
] as const;
export const OrderRejectionReasonSchema = z.enum(ORDER_REJECTION_REASON_VALUES);
export type OrderRejectionReason = z.infer<typeof OrderRejectionReasonSchema>;

/** catalogue_shares.share_type — 20260926000100_offer_catalogue_share_type.sql */
export const SHARE_TYPE_VALUES = ["catalogue", "product", "offer"] as const;
export const ShareTypeSchema = z.enum(SHARE_TYPE_VALUES);
export type ShareType = z.infer<typeof ShareTypeSchema>;

/**
 * catalogue_shares.destination — NOT a DB constraint (the column is plain
 * `text`), but a closed client-side vocabulary (frontend/src/features/share/constants.ts).
 * "Copy link" is the one destination with no share-sheet button of its own.
 */
export const SHARE_DESTINATION_VALUES = [
  "WhatsApp",
  "Status",
  "Instagram",
  "Other",
  "Copy link",
] as const;
export const ShareDestinationSchema = z.enum(SHARE_DESTINATION_VALUES);
export type ShareDestination = z.infer<typeof ShareDestinationSchema>;

/** products.unit — NOT a DB constraint (plain `text` default 'piece'), closed client-side vocabulary (frontend/src/features/products/constants.ts). */
export const UNIT_VALUES = [
  "piece",
  "kg",
  "500g",
  "pack",
  "dozen",
  "litre",
] as const;
export const UnitSchema = z.enum(UNIT_VALUES);
export type Unit = z.infer<typeof UnitSchema>;

/** stores.business_types[] — NOT a DB constraint (plain `text[]`), closed client-side vocabulary (frontend/src/features/auth/constants.ts). */
export const BUSINESS_TYPE_VALUES = [
  "Fruits",
  "Vegetables",
  "Grocery",
  "Bakery & Confectionery",
  "Fish & Seafood",
  "Chicken & Poultry",
  "Meat",
  "Clothing & Fashion",
  "Footwear",
  "Mobile & Accessories",
  "Electronics",
  "Pharmacy & Personal Care",
  "Home & Kitchen",
  "Other",
] as const;
export const BusinessTypeSchema = z.enum(BUSINESS_TYPE_VALUES);
export type BusinessType = z.infer<typeof BusinessTypeSchema>;

/** events.event_name — allow-listed inside both public.events' own CHECK constraint and log_event()'s allow-list (20260923000900_events.sql, 20260923001000_log_event.sql). Exact-string match only, never coerced. */
export const EVENT_NAME_VALUES = [
  "shop_created",
  "onboarding_completed",
  "product_added",
  "product_updated",
  "product_marked_available",
  "product_marked_unavailable",
  "offer_created",
  "offer_shared",
  "catalogue_shared",
  "catalogue_opened",
  "product_viewed",
  "add_to_cart",
  "checkout_started",
  "order_placed",
  "order_confirmed",
  "order_cancelled",
  "orders_opened",
] as const;
export const EventNameSchema = z.enum(EVENT_NAME_VALUES);
export type EventName = z.infer<typeof EventNameSchema>;

/** place_order()'s documented errcode P0001 messages (20260922000300_place_order.sql). */
export const PLACE_ORDER_ERROR_CODE_VALUES = [
  "store_not_found",
  "store_closed",
  "rate_limited",
  "item_unavailable",
  "invalid_name",
  "invalid_phone",
  "invalid_note",
  "invalid_items",
  "invalid_qty",
] as const;
export const PlaceOrderErrorCodeSchema = z.enum(PLACE_ORDER_ERROR_CODE_VALUES);
export type PlaceOrderErrorCode = z.infer<typeof PlaceOrderErrorCodeSchema>;

/** log_event()'s one raised errcode P0001 message (20260923001000_log_event.sql). Every other rejection (rate limit, no resolvable actor) resolves silently by design (D-04) — this is the only case a caller must handle as an error. */
export const LOG_EVENT_ERROR_CODE_VALUES = ["invalid_event_name"] as const;
export const LogEventErrorCodeSchema = z.enum(LOG_EVENT_ERROR_CODE_VALUES);
export type LogEventErrorCode = z.infer<typeof LogEventErrorCodeSchema>;
