import { z } from "zod";
import { BusinessTypeSchema } from "../enums";

export const UpdateStoreInputSchema = z.object({
  is_open: z.boolean().optional(),
  business_types: z.array(BusinessTypeSchema).optional(),
  location: z.string().nullable().optional(),
});
export type UpdateStoreInput = z.infer<typeof UpdateStoreInputSchema>;
