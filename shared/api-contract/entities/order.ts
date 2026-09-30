import { z } from "zod";
import {
  NonNegativeNumberSchema,
  TimestampSchema,
  UuidSchema,
} from "../primitives";
import { OrderRejectionReasonSchema, OrderStatusSchema } from "../enums";

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
