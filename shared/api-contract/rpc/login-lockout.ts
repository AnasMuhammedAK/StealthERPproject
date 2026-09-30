import { z } from "zod";

/** public.check_login_lock(p_phone) — pre-flight gate, called BEFORE signInWithPassword (20260923001400_login_lockout.sql). */
export const CheckLoginLockInputSchema = z.object({ p_phone: z.string() });
export type CheckLoginLockInput = z.infer<typeof CheckLoginLockInputSchema>;
export const CheckLoginLockOutputSchema = z.boolean();
export type CheckLoginLockOutput = z.infer<typeof CheckLoginLockOutputSchema>;

/** public.record_login_failure(p_phone) — called after a failed sign-in; true exactly when this call trips the 5-in-15-minute lock. */
export const RecordLoginFailureInputSchema = z.object({ p_phone: z.string() });
export type RecordLoginFailureInput = z.infer<
  typeof RecordLoginFailureInputSchema
>;
export const RecordLoginFailureOutputSchema = z.boolean();
export type RecordLoginFailureOutput = z.infer<
  typeof RecordLoginFailureOutputSchema
>;

/** public.clear_login_attempts() — no parameters; phone is derived server-side from the caller's own session. authenticated-only. */
export const ClearLoginAttemptsOutputSchema = z.void();
export type ClearLoginAttemptsOutput = z.infer<
  typeof ClearLoginAttemptsOutputSchema
>;
