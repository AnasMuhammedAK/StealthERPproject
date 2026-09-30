import { z } from "zod";
import { NonNegativeNumberSchema, UuidSchema } from "../primitives";
import { UnitSchema } from "../enums";

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
