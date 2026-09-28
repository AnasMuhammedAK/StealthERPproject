"use client";

// Customer product detail, presentational half (STOR-04, STOR-08, D-03,
// D-07). A different file from
// src/features/products/components/product-detail-view.tsx (the vendor's
// own) — same filename, different feature module, matching this project's
// established per-feature naming convention. No data-fetching hook here —
// the container already resolved the product and its offer; this component
// only renders what it is handed.
//
// D-05 adds the offer branch below: the badge and the large price block are
// additive above the existing name heading, and the shipped availability
// line survives byte-for-byte as the other branch of one conditional.
//
// STOR-04/D-07: below the divider, this is the one surface with room for
// the full `{qty} {unit}` stepper display and for a genuinely disabled state
// carrying TWO different sentences — a real closed shop versus the vendor's
// own preview — which the compact card and offers-strip deliberately
// collapse into a label/silent-disable instead (they have no room for an
// honest preview-specific sentence). qty, the three handlers,
// orderingDisabled, previewMode and cartCount are all supplied by the
// container (product-detail-page.tsx); this view never recomputes any of
// them and never reads the cart itself.

import { useRouter } from "next/navigation";
import { Minus, Package, Plus, Tag } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { formatPriceDisplay } from "@/features/products/lib/format-price";
import type {
  StorefrontProductDetail,
  StorefrontProductOffer,
} from "@/features/storefront/hooks/use-public-store-product";

export function StorefrontProductDetailView({
  slug,
  product,
  offer,
  qty,
  onAdd,
  onInc,
  onDec,
  orderingDisabled,
  previewMode,
  cartCount,
}: {
  slug: string;
  product: StorefrontProductDetail;
  offer: StorefrontProductOffer | null;
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  orderingDisabled: boolean;
  previewMode?: boolean;
  cartCount: number;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-5 pt-5 pb-4">
        <BackButton
          onBack={() => {
            // A customer arriving from a shared link has no in-app history
            // to go back to — the destination is named explicitly, never
            // router.back().
            router.push(`/store/${slug}`);
          }}
        />
        <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-foreground">
          {product.name}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- vendor-uploaded to Supabase Storage, no fixed domain for next/image
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="px-5 pt-5">
          {offer && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1.5 text-[11px] font-semibold text-[#D97706]">
                <Tag className="h-3 w-3" />
                Today&apos;s offer
              </span>
            </div>
          )}
          <h2 className="text-[24px] font-semibold tracking-tight text-foreground">
            {product.name}
          </h2>
          {product.category_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              {product.category_name}
            </p>
          )}
          <div className="mt-3">
            {offer ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-[28px] leading-none font-bold text-foreground">
                    ₹{formatPriceDisplay(offer.offerPrice)}
                  </span>
                  {offer.regularPrice != null && (
                    <span className="text-base text-muted-foreground line-through">
                      ₹{formatPriceDisplay(offer.regularPrice)}
                    </span>
                  )}
                </div>
                {offer.saving != null && offer.saving > 0 && (
                  <p className="mt-2 text-sm font-semibold text-[#D97706]">
                    Save ₹{formatPriceDisplay(offer.saving)} today
                  </p>
                )}
                {product.unit && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    per {product.unit}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                <p className="text-sm font-medium text-[#16A34A]">
                  Available · per {product.unit || "piece"}
                </p>
              </div>
            )}
          </div>
          <div className="my-5 h-px bg-border" />
          {orderingDisabled ? (
            <div className="flex h-14 w-full items-center justify-center rounded-2xl bg-muted">
              <p className="text-sm font-medium text-muted-foreground">
                {previewMode
                  ? "Ordering isn't live in this preview"
                  : "Store is closed · Orders paused"}
              </p>
            </div>
          ) : qty > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex h-14 flex-shrink-0 items-center gap-3 rounded-2xl bg-muted px-4">
                <button
                  type="button"
                  onClick={onDec}
                  aria-label={`Remove one ${product.name}`}
                  className="flex h-11 w-11 items-center justify-center transition-transform active:scale-90"
                >
                  <Minus className="h-4 w-4 text-foreground" />
                </button>
                <span className="w-16 text-center text-lg font-semibold text-foreground">
                  {qty} {product.unit}
                </span>
                <button
                  type="button"
                  onClick={onInc}
                  disabled={qty >= 99}
                  aria-label={`Add one more ${product.name}`}
                  className="flex h-11 w-11 items-center justify-center transition-transform active:scale-90 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4 text-foreground" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.push(`/store/${slug}/cart`);
                }}
                className="h-14 flex-1 rounded-2xl bg-foreground text-[15px] font-semibold text-background transition-transform active:scale-[0.98]"
              >
                View cart · {cartCount}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="h-14 w-full rounded-2xl bg-foreground text-[15px] font-semibold text-background transition-transform active:scale-[0.98]"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
