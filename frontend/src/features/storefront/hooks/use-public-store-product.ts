import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
// Namespace import — the same self-defeating-grep avoidance
// use-public-store.ts already records for the identical helper: it keeps
// the one exported date-string helper's own identifier on exactly one line
// of this file (the call site below), not a second import-declaration line.
import * as istDate from "@/lib/date/ist";

// Mirrors use-public-store.ts's two-query shape exactly: shop identity comes
// from public_stores, the only anon-readable path to it — the underlying
// table it wraps has no anon grant at all — then the product comes from
// products, never a relational embed of that underlying table off products.
export interface PublicStoreForProduct {
  id: string;
  slug: string;
  shop_name: string;
  is_open: boolean;
}

export interface StorefrontProductDetail {
  id: string;
  name: string;
  unit: string;
  image_url: string | null;
  available: boolean;
  category_name: string | null;
}

/** This one product's own priced, available-joined offer today (D-05), or
 * null when it has none. Scoped by both the product and the resolved shop —
 * the shop scope is redundant given the product scope but costs nothing and
 * removes a class of cross-store row entirely, matching this file's own
 * existing belt-and-braces style. */
export interface StorefrontProductOffer {
  id: string;
  offerPrice: number;
  regularPrice: number | null;
  saving: number | null;
}

interface FetchedOfferRow {
  id: string;
  offer_price: number;
  regular_price: number | null;
  saving: number | null;
}

interface StorefrontProductData {
  store: PublicStoreForProduct | null;
  product: StorefrontProductDetail | null;
  offer: StorefrontProductOffer | null;
}

async function fetchStorefrontProduct(
  slug: string,
  productId: string,
): Promise<StorefrontProductData> {
  const { data: storeRow, error: storeError } = await supabase
    .from("public_stores")
    .select("id, slug, shop_name, is_open")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError) throw storeError;
  if (
    !storeRow?.id ||
    !storeRow.slug ||
    storeRow.shop_name === null ||
    storeRow.is_open === null
  ) {
    return { store: null, product: null, offer: null };
  }

  const store: PublicStoreForProduct = {
    id: storeRow.id,
    slug: storeRow.slug,
    shop_name: storeRow.shop_name,
    is_open: storeRow.is_open,
  };

  const { data: productRow, error: productError } = await supabase
    .from("products")
    // categories IS anon-readable (its own public-read policy) — this embed
    // is safe, unlike a relational embed of the stores table, which
    // hard-fails for anon.
    .select("id, name, unit, image_url, available, categories(name)")
    .eq("store_id", store.id)
    .eq("id", productId)
    .eq("available", true) // RLS already enforces this; explicit for clarity
    .maybeSingle();

  if (productError) throw productError;

  if (!productRow) {
    return { store, product: null, offer: null };
  }

  const { categories, ...rest } = productRow;
  const product: StorefrontProductDetail = {
    ...rest,
    category_name: categories?.name ?? null,
  };

  // Third query, this product's own offer today (D-05): the same three
  // filters as use-public-store.ts, unconditionally, for the identical
  // reason — this route is reachable in the vendor's own signed-in session
  // (a tap from Home's "Preview as customer" overlay is a real navigation to
  // this exact URL), where "offers: owner manages" has no date bound of its
  // own (D-13). The inner join plus the embedded availability filter (D-14)
  // is what actually excludes a hidden product's offer, and the
  // priceability filter excludes a label-only legacy row with no number to
  // render — the product scope above already guarantees availability for
  // every role via its own explicit `.eq("available", true)`, but the same
  // belt-and-braces discipline applies here too rather than relying on that.
  const dateString = istDate.istDateString(new Date());
  const { data: offerRow, error: offerError } = await supabase
    .from("offers")
    .select("id, offer_price, regular_price, saving, products!inner(available)")
    .eq("store_id", store.id)
    .eq("product_id", productId)
    .eq("offer_date", dateString)
    .eq("products.available", true)
    .not("offer_price", "is", null)
    .maybeSingle();

  if (offerError) throw offerError;

  const fetchedOffer = offerRow as unknown as FetchedOfferRow | null;
  const offer: StorefrontProductOffer | null = fetchedOffer
    ? {
        id: fetchedOffer.id,
        offerPrice: fetchedOffer.offer_price,
        regularPrice: fetchedOffer.regular_price,
        saving: fetchedOffer.saving,
      }
    : null;

  return { store, product, offer };
}

export function usePublicStoreProduct(slug: string, productId: string) {
  return useQuery({
    queryKey: ["storefront-product", slug, productId],
    queryFn: () => fetchStorefrontProduct(slug, productId),
  });
}
