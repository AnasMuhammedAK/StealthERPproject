import type { z } from "zod";
import { IsoDateSchema } from "../primitives";

/** public.today_ist() — canonical IST "today", `returns date`. */
export const TodayIstOutputSchema = IsoDateSchema;
export type TodayIstOutput = z.infer<typeof TodayIstOutputSchema>;
