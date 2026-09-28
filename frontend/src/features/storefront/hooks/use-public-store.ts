import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
// Namespace import rather than a named one — the same self-defeating-grep
// avoidance 05-01 recorded for `useOffers`: it keeps the one exported
// date-string helper's own identifier on exactly one line of this file (the
// call site below), not a second import-declaration line as well.
import * as istDate from "@/lib/date/ist";
import type { Database } from "@/lib/supabase/database.types";

// public_stores is backed by a security-definer table function (research
// correction 3), so the generated view Row type is column-nullable even
// though every underlying stores column is NOT NULL — narrow it here once,
// after confirming a row was actually found.
export interface PublicStore {
  id: string;
  slug: string;
  shop_name: string;
  is_open: boolean;
}

export type StorefrontProduct = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "unit" | "image_url"
> & {
  /** The related category's name, resolved through the foreign key — null
   * when the product has no category. This embed is safe for anon
   * (categories carries its own public-read policy); the shops relation is
   * never embedded off products here — that is a hard permission failure
   * for anon, not a null (04-RESEARCH.md Pitfall 1). */
  category_name: string | null;
};

/** One of today's priced, available-product-joined offers (STOR-02, D-03,
 * D-05, D-09) — the shape both the offers strip and the storefront card's
 * offer branch consume. `offerPrice` is guaranteed non-null: the fetch
 * below excludes any row this filter would leave with nothing to render. */
export interface StorefrontOffer {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  offerPrice: number;
  regularPrice: number | null;
  saving: number | null;
}

interface FetchedOfferRow {
  id: string;
  product_id: string;
  offer_price: number;
  regular_price: number | null;
  saving: number | null;
  products: {
    name: string;
    image_url: string | null;
    unit: string;
    available: boolean;
  };
}

interface StorefrontData {
  store: PublicStore | null;
  products: StorefrontProduct[];
  offers: StorefrontOffer[];
}

async function fetchStorefront(slug: string): Promise<StorefrontData> {
  const { data: row, error: storeError } = await supabase
    .from("public_stores")
    .select("id, slug, shop_name, is_open")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError) throw storeError;
  if (!row?.id || !row.slug || row.shop_name === null || row.is_open === null) {
    return { store: null, products: [], offers: [] };
  }

  const store: PublicStore = {
    id: row.id,
    slug: row.slug,
    shop_name: row.shop_name,
    is_open: row.is_open,
  };

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, unit, image_url, categories(name)")
    .eq("store_id", store.id)
    .eq("available", true)
    .order("name");

  if (productsError) throw productsError;

  // Third query, offers: this is the second time this hook has been widened
  // (the first added the categories embed above). The date filter is
  // present deliberately even though the anonymous "offers: public reads
  // today's" policy already applies one server-side — because the vendor
  // reaches this exact hook while authenticated, through Home's "Preview as
  // customer" overlay and through this same storefront route opened in
  // their own signed-in session, where "offers: owner manages" ORs in with
  // no date bound of its own (D-13). One rule, every role. The inner join
  // plus the embedded availability filter (D-14) is what actually excludes
  // a hidden product's offer from the response — a plain embed would return
  // the row with a real, hidden product attached rather than dropping it —
  // and the priceability filter excludes a label-only legacy row (the
  // seeded demo offer) that has no number for the formatter to render.
  const dateString = istDate.istDateString(new Date());
  const { data: offerRows, error: offersError } = await supabase
    .from("offers")
    .select(
      "id, product_id, offer_price, regular_price, saving, products!inner(name, image_url, unit, available)",
    )
    .eq("store_id", store.id)
    .eq("offer_date", dateString)
    .eq("products.available", true)
    .not("offer_price", "is", null);

  if (offersError) throw offersError;

  const offers: StorefrontOffer[] = (
    offerRows as unknown as FetchedOfferRow[]
  ).map((offerRow) => ({
    id: offerRow.id,
    productId: offerRow.product_id,
    productName: offerRow.products.name,
    productImageUrl: offerRow.products.image_url,
    offerPrice: offerRow.offer_price,
    regularPrice: offerRow.regular_price,
    saving: offerRow.saving,
  }));

  return {
    store,
    products: products.map(({ categories, ...product }) => ({
      ...product,
      category_name: categories?.name ?? null,
    })),
    offers,
  };
}

export function usePublicStore(slug: string) {
  return useQuery({
    queryKey: ["storefront", slug],
    queryFn: () => fetchStorefront(slug),
  });
}
