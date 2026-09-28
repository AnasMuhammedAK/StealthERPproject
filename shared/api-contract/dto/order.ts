import { z } from "zod";
import { OrderRejectionReasonSchema, OrderStatusSchema } from "../enums";

/** Confirm/Cancel/Complete (ORDR-05). Reason/note only apply to a cancel. */
export const UpdateOrderStatusInputSchema = z.object({
  status: OrderStatusSchema,
  rejection_reason: OrderRejectionReasonSchema.nullable().optional(),
  rejection_note: z.string().nullable().optional(),
});
export type UpdateOrderStatusInput = z.infer<
  typeof UpdateOrderStatusInputSchema
>;
