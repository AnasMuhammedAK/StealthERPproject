/**
 * Shared API contract — Neighbourhood Store App.
 *
 * This project has no custom backend (PRD §2: TanStack Query calls
 * `supabase-js` directly from the browser; every write either goes through
 * an RLS policy or one of the two hardened RPCs in the RPC section below). This file
 * is the single source of truth for the *shape* of that surface, expressed
 * as Zod schemas so the same contract can validate on the client today and
 * be handed to a real backend later with no re-derivation.
 *
 * Kept in sync BY HAND against `frontend/supabase/migrations/*.sql` (18 files) and
 * `frontend/src/lib/supabase/database.types.ts` (generated from the live schema).
 * If you change a migration, update the matching schema here in the same
 * commit — nothing enforces this file file from the database automatically.
 */

import { z } from "zod";

// ─── primitives ──────────────────────────────────────────────────

/** uuid primary/foreign key, as returned by Postgres and PostgREST. */
export const UuidSchema = z.uuid();

/** `timestamptz`, serialized by PostgREST as an ISO 8601 string. */
export const TimestampSchema = z.string();

/** `date` (e.g. `offers.offer_date`), serialized as `YYYY-MM-DD`. */
export const IsoDateSchema = z.string();

/** Non-negative Postgres `numeric`, transported as a JS number by supabase-js. */
export const NonNegativeNumberSchema = z.number().nonnegative();

// ─── enums ───────────────────────────────────────────────────────

/**
 * Every value below is enforced by a live CHECK constraint, table column
 * default, or an allow-list inside a security-definer function. The
 * migration cited per enum is the authority; this file must never drift
 * wider or narrower than it.
 */

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

// ─── entities/store ──────────────────────────────────────────────

/** public.stores row. `phone` and `owner_id` never reach anon — only through public_stores. */
export const StoreRowSchema = z.object({
  id: UuidSchema,
  owner_id: UuidSchema,
  phone: z.string(),
  shop_name: z.string(),
  vendor_name: z.string(),
  slug: z.string(),
  business_types: z.array(BusinessTypeSchema),
  is_open: z.boolean(),
  location: z.string().nullable(),
  status: ActiveStatusSchema,
  last_active_at: TimestampSchema.nullable(),
  created_at: TimestampSchema,
});
export type StoreRow = z.infer<typeof StoreRowSchema>;

/** public.public_stores — the anon-safe view (private.public_store_rows()). Exactly these four columns; a sensitive stores column must never be added here. */
export const PublicStoreRowSchema = z.object({
  id: UuidSchema.nullable(),
  slug: z.string().nullable(),
  shop_name: z.string().nullable(),
  is_open: z.boolean().nullable(),
});
export type PublicStoreRow = z.infer<typeof PublicStoreRowSchema>;

// ─── entities/category ───────────────────────────────────────────

/** public.categories row. Unique on (store_id, name). */
export const CategoryRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  name: z.string(),
});
export type CategoryRow = z.infer<typeof CategoryRowSchema>;

// ─── entities/product ────────────────────────────────────────────

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

// ─── entities/offer ──────────────────────────────────────────────

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

// ─── entities/customer ───────────────────────────────────────────

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

// ─── entities/order ──────────────────────────────────────────────

/** public.orders row. rejection_reason/rejection_note are only meaningful when status = 'cancelled'. */
export const OrderRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  customer_id: UuidSchema.nullable(),
  customer_name: z.string(),
  customer_phone: z.string(),
  note: z.string().nullable(),
  total: NonNegativeNumberSchema.nullable(),
  status: OrderStatusSchema,
  is_new: z.boolean(),
  rejection_reason: OrderRejectionReasonSchema.nullable(),
  rejection_note: z.string().nullable(),
  created_at: TimestampSchema,
  confirmed_at: TimestampSchema.nullable(),
  cancelled_at: TimestampSchema.nullable(),
  completed_at: TimestampSchema.nullable(),
});
export type OrderRow = z.infer<typeof OrderRowSchema>;

/** public.order_items row. product_name/price are snapshotted by place_order from the shop's own live rows at order time — never re-read from products. */
export const OrderItemRowSchema = z.object({
  id: UuidSchema,
  order_id: UuidSchema,
  product_id: UuidSchema.nullable(),
  product_name: z.string(),
  qty: z.number().int().min(1).max(99),
  price: z.string().nullable(),
});
export type OrderItemRow = z.infer<typeof OrderItemRowSchema>;

// ─── entities/catalogue-share ────────────────────────────────────

/** public.catalogue_shares row. Vendor-only (RLS owner-scoped); no anon grant. */
export const CatalogueShareRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  product_id: UuidSchema.nullable(),
  share_type: ShareTypeSchema,
  destination: z.string(),
  created_at: TimestampSchema,
});
export type CatalogueShareRow = z.infer<typeof CatalogueShareRowSchema>;

// ─── entities/event ──────────────────────────────────────────────

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

// ─── dto/category ────────────────────────────────────────────────

export const CreateCategoryInputSchema = z.object({
  store_id: UuidSchema,
  name: z.string().trim().min(1),
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

// ─── dto/product ─────────────────────────────────────────────────

export const CreateProductInputSchema = z.object({
  store_id: UuidSchema,
  name: z.string().trim().min(1),
  category_id: UuidSchema.nullable().optional(),
  unit: UnitSchema.optional(),
  price: NonNegativeNumberSchema.nullable().optional(),
  image_url: z.string().nullable().optional(),
  available: z.boolean().optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

// ─── dto/offer ───────────────────────────────────────────────────

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

// ─── dto/store ───────────────────────────────────────────────────

export const UpdateStoreInputSchema = z.object({
  is_open: z.boolean().optional(),
  business_types: z.array(BusinessTypeSchema).optional(),
  location: z.string().nullable().optional(),
});
export type UpdateStoreInput = z.infer<typeof UpdateStoreInputSchema>;

// ─── dto/order ───────────────────────────────────────────────────

/** Confirm/Cancel/Complete (ORDR-05). Reason/note only apply to a cancel. */
export const UpdateOrderStatusInputSchema = z.object({
  status: OrderStatusSchema,
  rejection_reason: OrderRejectionReasonSchema.nullable().optional(),
  rejection_note: z.string().nullable().optional(),
});
export type UpdateOrderStatusInput = z.infer<
  typeof UpdateOrderStatusInputSchema
>;

// ─── dto/catalogue-share ─────────────────────────────────────────

export const CreateCatalogueShareInputSchema = z.object({
  store_id: UuidSchema,
  product_id: UuidSchema.nullable().optional(),
  share_type: ShareTypeSchema,
  destination: ShareDestinationSchema,
});
export type CreateCatalogueShareInput = z.infer<
  typeof CreateCatalogueShareInputSchema
>;

// ─── rpc/place-order ─────────────────────────────────────────────

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

// ─── rpc/log-event ───────────────────────────────────────────────

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

// ─── rpc/login-lockout ───────────────────────────────────────────

/** public.check_login_lock(p_phone) — pre-flight gate, called BEFORE signInWithPassword (20260923001400_login_lockout.sql). */
export const CheckLoginLockInputSchema = z.object({ p_phone: z.string() });
export type CheckLoginLockInput = z.infer<typeof CheckLoginLockInputSchema>;
export const CheckLoginLockOutputSchema = z.boolean();
export type CheckLoginLockOutput = z.infer<typeof CheckLoginLockOutputSchema>;

/** public.record_login_failure(p_phone) — called after a failed sign-in; true exactly when this call trips the 5-in-15-minute lock. */
export const RecordLoginFailureInputSchema = z.object({ p_phone: z.string() });
export type RecordLoginFailureInput = z.infer<
  typeof RecordLoginFailureInputSchema
>;
export const RecordLoginFailureOutputSchema = z.boolean();
export type RecordLoginFailureOutput = z.infer<
  typeof RecordLoginFailureOutputSchema
>;

/** public.clear_login_attempts() — no parameters; phone is derived server-side from the caller's own session. authenticated-only. */
export const ClearLoginAttemptsOutputSchema = z.void();
export type ClearLoginAttemptsOutput = z.infer<
  typeof ClearLoginAttemptsOutputSchema
>;

// ─── rpc/today-ist ───────────────────────────────────────────────

/** public.today_ist() — canonical IST "today", `returns date`. */
export const TodayIstOutputSchema = IsoDateSchema;
export type TodayIstOutput = z.infer<typeof TodayIstOutputSchema>;

// ─── auth ────────────────────────────────────────────────────────

/**
 * Not a table or an RPC — Supabase Auth itself is the write path
 * (signUp/signInWithPassword with a synthetic `<digits>@phone.local` email
 * and the 6-digit PIN as the password). These schemas validate the
 * client-side form contract only.
 */

export const PinSchema = z.string().regex(/^\d{6}$/, "PIN must be 6 digits");

export const SignUpInputSchema = z.object({
  phone: z.string().min(10),
  pin: PinSchema,
  shopName: z.string().trim().min(1),
  vendorName: z.string().trim().min(1),
  area: z.string().trim().optional(),
});
export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export const SignInInputSchema = z.object({
  phone: z.string().min(10),
  pin: PinSchema,
});
export type SignInInput = z.infer<typeof SignInInputSchema>;

/** The D-09 recovery path: same shop fields as signup, minus phone/pin (the session already exists). */
export const FinishShopInputSchema = z.object({
  shopName: z.string().trim().min(1),
  vendorName: z.string().trim().min(1),
  area: z.string().trim(),
});
export type FinishShopInput = z.infer<typeof FinishShopInputSchema>;

// ─── ApiContract namespace ─────────────────────────────────────

/** Convenience surface for consumers that want the whole contract as one namespaced object instead of many named imports. */
export const ApiContract = {
  enums: {
    ActiveStatusSchema,
    OrderStatusSchema,
    OrderRejectionReasonSchema,
    ShareTypeSchema,
    ShareDestinationSchema,
    UnitSchema,
    BusinessTypeSchema,
    EventNameSchema,
    PlaceOrderErrorCodeSchema,
    LogEventErrorCodeSchema,
  },
  rows: {
    StoreRowSchema,
    PublicStoreRowSchema,
    CategoryRowSchema,
    ProductRowSchema,
    OfferRowSchema,
    CustomerRowSchema,
    OrderRowSchema,
    OrderItemRowSchema,
    CatalogueShareRowSchema,
    EventRowSchema,
  },
  dto: {
    CreateCategoryInputSchema,
    CreateProductInputSchema,
    UpdateProductInputSchema,
    CreateOfferInputSchema,
    UpdateStoreInputSchema,
    UpdateOrderStatusInputSchema,
    CreateCatalogueShareInputSchema,
  },
  rpc: {
    placeOrder: {
      input: PlaceOrderInputSchema,
      output: PlaceOrderOutputSchema,
    },
    logEvent: { input: LogEventInputSchema, output: LogEventOutputSchema },
    checkLoginLock: {
      input: CheckLoginLockInputSchema,
      output: CheckLoginLockOutputSchema,
    },
    recordLoginFailure: {
      input: RecordLoginFailureInputSchema,
      output: RecordLoginFailureOutputSchema,
    },
    clearLoginAttempts: { output: ClearLoginAttemptsOutputSchema },
    todayIst: { output: TodayIstOutputSchema },
  },
  auth: {
    SignUpInputSchema,
    SignInInputSchema,
    PinSchema,
    FinishShopInputSchema,
  },
} as const;
