import { z } from "zod";
import { UuidSchema } from "../primitives";
import { ShareDestinationSchema, ShareTypeSchema } from "../enums";

export const CreateCatalogueShareInputSchema = z.object({
  store_id: UuidSchema,
  product_id: UuidSchema.nullable().optional(),
  share_type: ShareTypeSchema,
  destination: ShareDestinationSchema,
});
export type CreateCatalogueShareInput = z.infer<
  typeof CreateCatalogueShareInputSchema
>;
