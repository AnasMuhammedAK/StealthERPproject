import { z } from "zod";
import { TimestampSchema, UuidSchema } from "../primitives";
import { ActiveStatusSchema, BusinessTypeSchema } from "../enums";

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
