/**
 * Not a table or an RPC — Supabase Auth itself is the write path
 * (signUp/signInWithPassword with a synthetic `<digits>@phone.local` email
 * and the 6-digit PIN as the password). These schemas validate the
 * client-side form contract only.
 */

import { z } from "zod";

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
