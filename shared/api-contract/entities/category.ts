import { z } from "zod";
import { UuidSchema } from "../primitives";

/** public.categories row. Unique on (store_id, name). */
export const CategoryRowSchema = z.object({
  id: UuidSchema,
  store_id: UuidSchema,
  name: z.string(),
});
export type CategoryRow = z.infer<typeof CategoryRowSchema>;
