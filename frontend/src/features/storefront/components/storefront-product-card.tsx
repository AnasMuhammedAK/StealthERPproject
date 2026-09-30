"use client";

// Customer product card (STOR-03, STOR-04, D-03, D-07). The image/name block
// is a navigation button opening the product's own deep link; a sibling
// button below holds Add or the stepper (divergence 4) — the outer element
// is a plain container, not a button, because nesting the stepper's own
// buttons inside the card's outer button would be interactive-in-interactive
// (invalid HTML, inconsistent across browsers). qty, the three handlers and
// orderingDisabled are all supplied by the container (storefront-page.tsx);
// this card never recomputes any of them.
//
// D-05/D-09: renders in both the offers strip above and its own category
// grid position — the same product, the same offer, on purpose (D-09's
// approved repetition). The offer branch below is additive; the shipped
// non-offer per-unit line is untouched, just moved into the other branch of
// one conditional.

import { useRouter } from "next/navigation";
import { Minus, Package, Plus } from "lucide-react";
import { formatPriceDisplay } from "@/features/products/lib/format-price";
import type {
  StorefrontOffer,
  StorefrontProduct,
} from "@/features/storefront/hooks/use-public-store";

export function StorefrontProductCard({
  slug,
  product,
  offer,
  qty,
  onAdd,
  onInc,
  onDec,
  orderingDisabled,
  previewMode,
}: {
  slug: string;
  product: StorefrontProduct;
  offer?: StorefrontOffer;
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  orderingDisabled: boolean;
  previewMode?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-left">
      <button
        type="button"
        onClick={() => {
          router.push(`/store/${slug}/p/${product.id}`);
        }}
        className="block w-full text-left transition-opacity active:opacity-90"
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- vendor-uploaded to Supabase Storage, no fixed domain for next/image
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          {offer && (
            <span className="absolute top-1.5 left-1.5 rounded-full bg-[#FEF3C7] px-1.5 py-0.5 text-[8px] leading-none font-bold text-[#D97706]">
              OFFER
            </span>
          )}
        </div>
        <div className="px-2 pt-2">
          <p className="mb-1 line-clamp-2 text-[11px] leading-snug font-semibold text-foreground">
            {product.name}
          </p>
          {offer ? (
            <div className="mb-1.5">
              <div className="flex flex-wrap items-baseline gap-1">
                <span className="text-xs font-bold text-foreground">
                  ₹{formatPriceDisplay(offer.offerPrice)}
                </span>
                {offer.regularPrice != null && (
                  <span className="text-[9px] text-muted-foreground line-through">
                    ₹{formatPriceDisplay(offer.regularPrice)}
                  </span>
                )}
              </div>
              {offer.saving != null && offer.saving > 0 && (
                <p className="text-[9px] font-semibold text-[#D97706]">
                  Save ₹{formatPriceDisplay(offer.saving)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#16A34A]" />
              <p className="text-[10px] font-medium text-[#16A34A]">
                per {product.unit || "piece"}
              </p>
            </div>
          )}
        </div>
      </button>
      <div className="px-2 pb-2.5">
        {orderingDisabled ? (
          <div className="flex h-11 w-full items-center justify-center rounded-lg bg-muted">
            <span className="text-[10px] text-muted-foreground">
              {previewMode ? "Add" : "Closed"}
            </span>
          </div>
        ) : qty > 0 ? (
          <div className="flex h-11 w-full items-center justify-between rounded-lg bg-foreground px-0">
            <button
              type="button"
              onClick={onDec}
              aria-label={`Remove one ${product.name}`}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center transition-transform active:scale-90"
            >
              <Minus className="h-3 w-3 text-background" />
            </button>
            <span className="text-xs font-semibold text-background">{qty}</span>
            <button
              type="button"
              onClick={onInc}
              disabled={qty >= 99}
              aria-label={`Add one more ${product.name}`}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center transition-transform active:scale-90 disabled:opacity-40"
            >
              <Plus className="h-3 w-3 text-background" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="h-11 w-full rounded-lg bg-foreground text-[11px] font-semibold text-background transition-transform active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}
