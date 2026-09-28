// The cart primitive (D-02, D-03; RESEARCH Pattern 1 / Pitfall 4). Imports
// nothing — not even a type — so `node --test` can load this file directly
// under Node 24's native TypeScript stripping, the same zero-import
// convention `visitor-id.ts`/`remembered-phone.ts`/`format-price.ts` already
// establish for every dependency-free storage/parsing module in this
// project. `src/features/storefront/hooks/use-cart.ts` is the thin
// `useSyncExternalStore` binding over this pure module.
//
// Why the module-level cache exists: React's `useSyncExternalStore` requires
// its snapshot getter to return the SAME reference across calls when
// nothing has changed — a freshly `JSON.parse`d array on every call is a
// new identity every render, which React treats as "always changed" and
// causes an infinite re-render loop. `readCart` therefore returns a cached
// reference per shop slug, replaced only when `writeCart` actually stores a
// new value.
//
// Why an entry carries a cached display name, a cached unit and a
// was-it-offer-priced flag but no money value of any kind: `place_order`
// recomputes every price from live rows and ignores any client-supplied
// price — a cached amount here would be a second, driftable source of truth
// for a figure this client is never authoritative about. The cached
// name/unit exist so a later stale-item message can still name a product
// that has since disappeared from the storefront read (its name becomes
// unresolvable once it is gone); the offer flag exists so a reconciliation
// pass can tell "this line never had a price" (keep it) apart from "this
// line HAD an offer that has since expired" (drop it) — two cases that look
// identical if only the id and the quantity are stored.

const MIN_QTY = 1;
const MAX_QTY = 99;

/** Structural shape of Web Storage's read/write surface — deliberately not
 * the DOM lib's `Storage` type, so a plain in-memory fake can be injected in
 * a test without a browser. */
export interface CartStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CartItem {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  hadOffer: boolean;
}

const cache = new Map<string, CartItem[]>();
const listeners = new Map<string, Set<() => void>>();

export function cartStorageKey(slug: string): string {
  return `cart:${slug}`;
}

function resolveStorage(
  storage: CartStorage | undefined,
): CartStorage | undefined {
  if (storage) {
    return storage;
  }
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  return localStorage;
}

function clampQty(value: number): number {
  const rounded = Math.round(value);
  if (rounded < MIN_QTY) {
    return MIN_QTY;
  }
  if (rounded > MAX_QTY) {
    return MAX_QTY;
  }
  return rounded;
}

/** Validates every entry in a parsed value strictly. Returns `null` (never a
 * partially-filtered array) the moment any entry fails shape validation —
 * an item list with one corrupt entry cannot be trusted item-by-item, so the
 * whole read resolves to an empty cart rather than a silently truncated one.
 * A numeric quantity outside 1..99 is NOT a shape failure — it is clamped
 * and the entry is kept, matching a hand-edited cart's own defensive read. */
function sanitizeEntries(parsed: unknown): CartItem[] | null {
  if (!Array.isArray(parsed)) {
    return null;
  }
  const result: CartItem[] = [];
  for (const raw of parsed) {
    if (typeof raw !== "object" || raw === null) {
      return null;
    }
    const entry = raw as Record<string, unknown>;
    if (typeof entry.productId !== "string" || entry.productId.length === 0) {
      return null;
    }
    if (typeof entry.name !== "string") {
      return null;
    }
    if (typeof entry.unit !== "string") {
      return null;
    }
    if (typeof entry.qty !== "number" || !Number.isFinite(entry.qty)) {
      return null;
    }
    result.push({
      productId: entry.productId,
      name: entry.name,
      unit: entry.unit,
      qty: clampQty(entry.qty),
      hadOffer: entry.hadOffer === true,
    });
  }
  return result;
}

function notify(slug: string): void {
  const set = listeners.get(slug);
  if (!set) {
    return;
  }
  for (const listener of set) {
    listener();
  }
}

/** Reads a shop's cart. Returns the SAME reference on every call until a
 * write replaces it (the property `useSyncExternalStore`'s snapshot getter
 * requires). Never throws — an absent, refused or malformed store all
 * resolve to an empty list. */
export function readCart(
  slug: string,
  storage?: CartStorage,
): readonly CartItem[] {
  const cached = cache.get(slug);
  if (cached) {
    return cached;
  }

  const store = resolveStorage(storage);
  let items: CartItem[] = [];
  if (store) {
    try {
      const raw = store.getItem(cartStorageKey(slug));
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        items = sanitizeEntries(parsed) ?? [];
      }
    } catch {
      // Malformed JSON, or a storage read that throws (Safari private
      // browsing) — resolve to an empty cart rather than propagating.
      items = [];
    }
  }

  cache.set(slug, items);
  return items;
}

/** Writes a shop's cart. The cache is replaced FIRST so a snapshot getter
 * called synchronously after this returns already sees the new value, then
 * the storage write is attempted inside a never-throw wrapper, then every
 * subscriber for this slug is notified UNCONDITIONALLY — even when the
 * underlying storage write itself was refused, the in-memory value React is
 * holding still advances for the life of this tab. An empty list removes
 * the stored key entirely rather than persisting an empty array string. */
export function writeCart(
  slug: string,
  items: CartItem[],
  storage?: CartStorage,
): void {
  cache.set(slug, items);

  const store = resolveStorage(storage);
  if (store) {
    try {
      if (items.length === 0) {
        store.removeItem(cartStorageKey(slug));
      } else {
        store.setItem(cartStorageKey(slug), JSON.stringify(items));
      }
    } catch {
      // Storage full, refused or private-browsing — the cache above still
      // reflects the change for this tab's lifetime; never throw here.
    }
  }

  notify(slug);
}

/** Registers a listener for a slug's writes. Returns an unsubscribe
 * function. Stable per slug across calls with the same slug string — the
 * hook binding is responsible for keeping the function reference itself
 * stable across renders (via useCallback keyed on the slug). */
export function subscribeToCart(
  slug: string,
  listener: () => void,
): () => void {
  let set = listeners.get(slug);
  if (!set) {
    set = new Set();
    listeners.set(slug, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

/** Pure transform: adds a new entry at quantity 1, or increments an
 * existing entry's quantity by one (clamped at 99) if the product is
 * already in the list. Never mutates the input array. */
export function addOrIncrementItem(
  items: readonly CartItem[],
  entry: { productId: string; name: string; unit: string; hadOffer: boolean },
): CartItem[] {
  const existing = items.find((item) => item.productId === entry.productId);
  if (existing) {
    return items.map((item) =>
      item.productId === entry.productId
        ? { ...item, qty: clampQty(item.qty + 1) }
        : item,
    );
  }
  return [
    ...items,
    {
      productId: entry.productId,
      name: entry.name,
      unit: entry.unit,
      qty: MIN_QTY,
      hadOffer: entry.hadOffer,
    },
  ];
}

/** Pure transform: increments an existing entry's quantity by one, clamped
 * at 99. A no-op if the product is not in the list. */
export function incrementItemQty(
  items: readonly CartItem[],
  productId: string,
): CartItem[] {
  return items.map((item) =>
    item.productId === productId
      ? { ...item, qty: clampQty(item.qty + 1) }
      : item,
  );
}

/** Pure transform: decrements an existing entry's quantity by one. At
 * quantity 1, removes the entry entirely rather than storing zero (D-03's
 * "behavior at 1"). A no-op if the product is not in the list. */
export function decrementItemQty(
  items: readonly CartItem[],
  productId: string,
): CartItem[] {
  const existing = items.find((item) => item.productId === productId);
  if (!existing) {
    return items as CartItem[];
  }
  if (existing.qty <= MIN_QTY) {
    return items.filter((item) => item.productId !== productId);
  }
  return items.map((item) =>
    item.productId === productId ? { ...item, qty: item.qty - 1 } : item,
  );
}

/** Pure transform: removes an entry entirely regardless of its quantity. */
export function removeCartItem(
  items: readonly CartItem[],
  productId: string,
): CartItem[] {
  return items.filter((item) => item.productId !== productId);
}
