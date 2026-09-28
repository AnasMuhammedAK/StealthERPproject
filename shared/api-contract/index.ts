/**
 * Shared API contract — Neighbourhood Store App.
 *
 * This project has no custom backend (PRD §2: TanStack Query calls
 * `supabase-js` directly from the browser; every write either goes through
 * an RLS policy or one of the two hardened RPCs in ./rpc). This module tree
 * is the single source of truth for the *shape* of that surface, expressed
 * as Zod schemas so the same contract can validate on the client today and
 * be handed to a real backend later with no re-derivation.
 *
 * Kept in sync BY HAND against `frontend/supabase/migrations/*.sql` (18 files) and
 * `frontend/src/lib/supabase/database.types.ts` (generated from the live schema).
 * If you change a migration, update the matching schema here in the same
 * commit — nothing enforces this file tree from the database automatically.
 *
 * Layout:
 *   primitives.ts   — Uuid/Timestamp/IsoDate/NonNegativeNumber
 *   enums.ts        — every closed vocabulary, each citing its source constraint
 *   entities/       — one file per DB table/view = "the truth as stored"
 *   dto/            — one file per mutation payload, grouped by entity
 *   rpc/            — one file per RPC, input+output together
 *   auth.ts         — signup/sign-in payloads (not a table or RPC)
 */

export * from "./primitives";
export * from "./enums";

export * from "./entities/store";
export * from "./entities/category";
export * from "./entities/product";
export * from "./entities/offer";
export * from "./entities/customer";
export * from "./entities/order";
export * from "./entities/catalogue-share";
export * from "./entities/event";

export * from "./dto/category";
export * from "./dto/product";
export * from "./dto/offer";
export * from "./dto/store";
export * from "./dto/order";
export * from "./dto/catalogue-share";

export * from "./rpc/place-order";
export * from "./rpc/log-event";
export * from "./rpc/login-lockout";
export * from "./rpc/today-ist";

export * from "./auth";

import {
  ActiveStatusSchema,
  BusinessTypeSchema,
  EventNameSchema,
  LogEventErrorCodeSchema,
  OrderRejectionReasonSchema,
  OrderStatusSchema,
  PlaceOrderErrorCodeSchema,
  ShareDestinationSchema,
  ShareTypeSchema,
  UnitSchema,
} from "./enums";
import { StoreRowSchema, PublicStoreRowSchema } from "./entities/store";
import { CategoryRowSchema } from "./entities/category";
import { ProductRowSchema } from "./entities/product";
import { OfferRowSchema } from "./entities/offer";
import { CustomerRowSchema } from "./entities/customer";
import { OrderItemRowSchema, OrderRowSchema } from "./entities/order";
import { CatalogueShareRowSchema } from "./entities/catalogue-share";
import { EventRowSchema } from "./entities/event";
import { CreateCategoryInputSchema } from "./dto/category";
import {
  CreateProductInputSchema,
  UpdateProductInputSchema,
} from "./dto/product";
import { CreateOfferInputSchema } from "./dto/offer";
import { UpdateStoreInputSchema } from "./dto/store";
import { UpdateOrderStatusInputSchema } from "./dto/order";
import { CreateCatalogueShareInputSchema } from "./dto/catalogue-share";
import {
  PlaceOrderInputSchema,
  PlaceOrderOutputSchema,
} from "./rpc/place-order";
import { LogEventInputSchema, LogEventOutputSchema } from "./rpc/log-event";
import {
  CheckLoginLockInputSchema,
  CheckLoginLockOutputSchema,
  ClearLoginAttemptsOutputSchema,
  RecordLoginFailureInputSchema,
  RecordLoginFailureOutputSchema,
} from "./rpc/login-lockout";
import { TodayIstOutputSchema } from "./rpc/today-ist";
import {
  FinishShopInputSchema,
  PinSchema,
  SignInInputSchema,
  SignUpInputSchema,
} from "./auth";

/** Convenience surface for consumers that want the whole contract as one namespaced object instead of many named imports. */
export const ApiContract = {
  enums: {
    ActiveStatusSchema,
    OrderStatusSchema,
    OrderRejectionReasonSchema,
    ShareTypeSchema,
    ShareDestinationSchema,
    UnitSchema,
    BusinessTypeSchema,
    EventNameSchema,
    PlaceOrderErrorCodeSchema,
    LogEventErrorCodeSchema,
  },
  rows: {
    StoreRowSchema,
    PublicStoreRowSchema,
    CategoryRowSchema,
    ProductRowSchema,
    OfferRowSchema,
    CustomerRowSchema,
    OrderRowSchema,
    OrderItemRowSchema,
    CatalogueShareRowSchema,
    EventRowSchema,
  },
  dto: {
    CreateCategoryInputSchema,
    CreateProductInputSchema,
    UpdateProductInputSchema,
    CreateOfferInputSchema,
    UpdateStoreInputSchema,
    UpdateOrderStatusInputSchema,
    CreateCatalogueShareInputSchema,
  },
  rpc: {
    placeOrder: {
      input: PlaceOrderInputSchema,
      output: PlaceOrderOutputSchema,
    },
    logEvent: { input: LogEventInputSchema, output: LogEventOutputSchema },
    checkLoginLock: {
      input: CheckLoginLockInputSchema,
      output: CheckLoginLockOutputSchema,
    },
    recordLoginFailure: {
      input: RecordLoginFailureInputSchema,
      output: RecordLoginFailureOutputSchema,
    },
    clearLoginAttempts: { output: ClearLoginAttemptsOutputSchema },
    todayIst: { output: TodayIstOutputSchema },
  },
  auth: {
    SignUpInputSchema,
    SignInInputSchema,
    PinSchema,
    FinishShopInputSchema,
  },
} as const;
