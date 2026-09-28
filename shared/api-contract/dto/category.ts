import { z } from "zod";
import { UuidSchema } from "../primitives";

export const CreateCategoryInputSchema = z.object({
  store_id: UuidSchema,
  name: z.string().trim().min(1),
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
