// Unit test (no database, no browser): proves the cart store's reference
// identity (the property React's useSyncExternalStore primitive requires),
// its quantity rules (D-03: whole numbers, 1..99, decrement-at-one removes),
// its per-slug isolation (D-02), its subscriber notifications, and its
// never-throws resilience against absent/throwing/malformed storage
// (RESEARCH Pattern 1 / Pitfall 4). Written and run BEFORE
// src/features/storefront/lib/cart-store.ts exists, following the same
// injection style tests/unit/visitor-id.test.mjs and
// tests/unit/remembered-phone.test.mjs already established.
//
// Each test uses its own unique slug (freshSlug()) — the store's
// module-level cache is keyed by slug alone, so reusing a slug across two
// independent test() blocks in the same process would let the second test
// read the first test's cached value instead of its own injected fake.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cartStorageKey,
  readCart,
  writeCart,
  subscribeToCart,
  addOrIncrementItem,
  incrementItemQty,
  decrementItemQty,
  removeCartItem,
} from "../../src/features/storefront/lib/cart-store.ts";

let slugCounter = 0;
function freshSlug() {
  slugCounter += 1;
  return `test-shop-${String(slugCounter)}`;
}

function fakeStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    // exposed for assertions only, not part of CartStorage
    _data: data,
  };
}

const TOMATOES = {
  productId: "p-tomatoes",
  name: "Tomatoes",
  unit: "kg",
  hadOffer: true,
};
const BANANAS = {
  productId: "p-bananas",
  name: "Bananas",
  unit: "dozen",
  hadOffer: false,
};

test("readCart: reading a shop with nothing stored returns an empty list, and reading it twice returns the SAME reference", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  const first = readCart(slug, storage);
  const second = readCart(slug, storage);

  assert.deepEqual(first, []);
  assert.equal(
    first,
    second,
    "two reads with no intervening write must return the identical reference",
  );
});

test("writeCart via addOrIncrementItem: adding a product stores one entry with quantity 1 carrying its cached name and unit; reading afterwards returns a DIFFERENT reference", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  const before = readCart(slug, storage);
  writeCart(slug, addOrIncrementItem(before, TOMATOES), storage);
  const after = readCart(slug, storage);

  assert.notEqual(
    after,
    before,
    "a write must change the cached reference identity",
  );
  assert.equal(after.length, 1);
  assert.deepEqual(after[0], {
    productId: "p-tomatoes",
    name: "Tomatoes",
    unit: "kg",
    qty: 1,
    hadOffer: true,
  });
});

test("addOrIncrementItem: adding the same product again increments the existing entry rather than appending a second one; the list length stays 1", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  writeCart(
    slug,
    addOrIncrementItem(readCart(slug, storage), TOMATOES),
    storage,
  );
  writeCart(
    slug,
    addOrIncrementItem(readCart(slug, storage), TOMATOES),
    storage,
  );
  const items = readCart(slug, storage);

  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 2);
});

test("incrementItemQty: incrementing at 99 leaves the quantity at 99 — incrementing past it never produces 100", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  writeCart(
    slug,
    addOrIncrementItem(readCart(slug, storage), TOMATOES),
    storage,
  );
  let items = readCart(slug, storage);
  for (let i = 0; i < 200; i++) {
    items = incrementItemQty(items, "p-tomatoes");
  }
  writeCart(slug, items, storage);

  assert.equal(readCart(slug, storage)[0].qty, 99);
});

test("decrementItemQty: decrementing at 1 removes the entry entirely — the list is empty, not an entry with quantity 0", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  writeCart(
    slug,
    addOrIncrementItem(readCart(slug, storage), TOMATOES),
    storage,
  );
  writeCart(
    slug,
    decrementItemQty(readCart(slug, storage), "p-tomatoes"),
    storage,
  );

  assert.deepEqual(readCart(slug, storage), []);
});

test("decrementItemQty: decrementing above 1 reduces the quantity by one without removing the entry", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  let items = addOrIncrementItem(readCart(slug, storage), TOMATOES);
  items = incrementItemQty(items, "p-tomatoes"); // qty 2
  writeCart(slug, items, storage);

  writeCart(
    slug,
    decrementItemQty(readCart(slug, storage), "p-tomatoes"),
    storage,
  );

  const after = readCart(slug, storage);
  assert.equal(after.length, 1);
  assert.equal(after[0].qty, 1);
});

test("removeCartItem: removes the named entry regardless of its quantity, leaving other entries untouched", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  let items = addOrIncrementItem(readCart(slug, storage), TOMATOES);
  items = addOrIncrementItem(items, BANANAS);
  writeCart(slug, items, storage);

  writeCart(
    slug,
    removeCartItem(readCart(slug, storage), "p-tomatoes"),
    storage,
  );

  const after = readCart(slug, storage);
  assert.equal(after.length, 1);
  assert.equal(after[0].productId, "p-bananas");
});

test("readCart: two different shop slugs keep independent lists — writing one leaves the other untouched, under its own storage key", () => {
  const slugA = freshSlug();
  const slugB = freshSlug();
  const storage = fakeStorage();

  writeCart(
    slugA,
    addOrIncrementItem(readCart(slugA, storage), TOMATOES),
    storage,
  );

  assert.equal(readCart(slugA, storage).length, 1);
  assert.deepEqual(readCart(slugB, storage), []);
  assert.notEqual(cartStorageKey(slugA), cartStorageKey(slugB));
  assert.equal(storage._data.has(cartStorageKey(slugB)), false);
});

test("subscribeToCart: a subscriber registered for a slug is called on every write to that slug and NOT called on a write to a different slug; unsubscribing stops the calls", () => {
  const slugA = freshSlug();
  const slugB = freshSlug();
  const storage = fakeStorage();

  let callsForA = 0;
  const unsubscribe = subscribeToCart(slugA, () => {
    callsForA += 1;
  });

  writeCart(
    slugB,
    addOrIncrementItem(readCart(slugB, storage), TOMATOES),
    storage,
  );
  assert.equal(
    callsForA,
    0,
    "a write to a different slug must not notify this subscriber",
  );

  writeCart(
    slugA,
    addOrIncrementItem(readCart(slugA, storage), TOMATOES),
    storage,
  );
  assert.equal(callsForA, 1);

  unsubscribe();
  writeCart(
    slugA,
    addOrIncrementItem(readCart(slugA, storage), BANANAS),
    storage,
  );
  assert.equal(
    callsForA,
    1,
    "an unsubscribed listener must not be called again",
  );
});

test("readCart: a storage fake that THROWS on read resolves to an empty list rather than propagating", () => {
  const slug = freshSlug();
  const storage = {
    getItem() {
      throw new Error("QuotaExceededError: private browsing");
    },
    setItem() {},
    removeItem() {},
  };

  assert.doesNotThrow(() => {
    const items = readCart(slug, storage);
    assert.deepEqual(items, []);
  });
});

test("writeCart: a storage fake that throws on write still advances the in-memory value AND still notifies subscribers", () => {
  const slug = freshSlug();
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("QuotaExceededError: private browsing");
    },
    removeItem() {},
  };

  let notified = 0;
  subscribeToCart(slug, () => {
    notified += 1;
  });

  assert.doesNotThrow(() => {
    writeCart(
      slug,
      addOrIncrementItem(readCart(slug, storage), TOMATOES),
      storage,
    );
  });

  assert.equal(
    readCart(slug, storage).length,
    1,
    "the in-memory cache must still reflect the write",
  );
  assert.equal(
    notified,
    1,
    "subscribers must still be notified even when the underlying storage write failed",
  );
});

test("readCart: malformed stored JSON (invalid syntax) resolves to an empty list rather than throwing", () => {
  const slug = freshSlug();
  const storage = fakeStorage();
  storage._data.set(cartStorageKey(slug), "{not valid json");

  assert.doesNotThrow(() => {
    assert.deepEqual(readCart(slug, storage), []);
  });
});

test("readCart: stored JSON of the wrong shape (an object instead of a list) resolves to an empty list", () => {
  const slug = freshSlug();
  const storage = fakeStorage();
  storage._data.set(
    cartStorageKey(slug),
    JSON.stringify({ productId: "p-tomatoes" }),
  );

  assert.deepEqual(readCart(slug, storage), []);
});

test("readCart: an entry with a non-numeric quantity resolves the whole read to an empty list rather than producing a corrupt entry", () => {
  const slug = freshSlug();
  const storage = fakeStorage();
  storage._data.set(
    cartStorageKey(slug),
    JSON.stringify([
      {
        productId: "p-tomatoes",
        name: "Tomatoes",
        unit: "kg",
        qty: "abc",
        hadOffer: false,
      },
    ]),
  );

  assert.deepEqual(readCart(slug, storage), []);
});

test("readCart: a stored entry whose quantity is outside 1..99 is clamped on read, so a hand-edited cart can never reach the server with a value it would reject", () => {
  const slugHigh = freshSlug();
  const storageHigh = fakeStorage();
  storageHigh._data.set(
    cartStorageKey(slugHigh),
    JSON.stringify([
      {
        productId: "p-tomatoes",
        name: "Tomatoes",
        unit: "kg",
        qty: 500,
        hadOffer: false,
      },
    ]),
  );
  assert.equal(readCart(slugHigh, storageHigh)[0].qty, 99);

  const slugLow = freshSlug();
  const storageLow = fakeStorage();
  storageLow._data.set(
    cartStorageKey(slugLow),
    JSON.stringify([
      {
        productId: "p-tomatoes",
        name: "Tomatoes",
        unit: "kg",
        qty: 0,
        hadOffer: false,
      },
    ]),
  );
  assert.equal(readCart(slugLow, storageLow)[0].qty, 1);
});

test("writeCart: clearing a shop's cart (writing an empty list) empties the list and removes the stored key", () => {
  const slug = freshSlug();
  const storage = fakeStorage();

  writeCart(
    slug,
    addOrIncrementItem(readCart(slug, storage), TOMATOES),
    storage,
  );
  assert.equal(storage._data.has(cartStorageKey(slug)), true);

  writeCart(slug, [], storage);

  assert.deepEqual(readCart(slug, storage), []);
  assert.equal(
    storage._data.has(cartStorageKey(slug)),
    false,
    "the stored key itself must be removed, not merely set to an empty array string",
  );
});
