import { z } from "zod";
import { TimestampSchema, UuidSchema } from "../primitives";
import { ShareTypeSchema } from "../enums";

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
