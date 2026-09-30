import { z } from "zod";

/** uuid primary/foreign key, as returned by Postgres and PostgREST. */
export const UuidSchema = z.uuid();

/** `timestamptz`, serialized by PostgREST as an ISO 8601 string. */
export const TimestampSchema = z.string();

/** `date` (e.g. `offers.offer_date`), serialized as `YYYY-MM-DD`. */
export const IsoDateSchema = z.string();

/** Non-negative Postgres `numeric`, transported as a JS number by supabase-js. */
export const NonNegativeNumberSchema = z.number().nonnegative();
